"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, TrendingUp, Heart, FileText, ClipboardList,
  UserCircle, UserPlus, X, Loader2, Search, Tag, Send,
  Mail, MessageSquare, Settings2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactRow = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  source: string;
  sources_breakdown: Record<string, number>;
  first_seen_at: string;
  last_seen_at: string;
};

type CrmTag = { id: string; name: string; color: string };
type Tab = "all" | "givers" | "members" | "form" | "survey" | "manual";
type EngagementFilter = "all" | "green" | "yellow" | "red" | "none";

// ─── Engagement helpers ────────────────────────────────────────────────────────

const THRESHOLD_KEY = "give_people_engagement_threshold_v1";

type EngagementLevel = "green" | "yellow" | "red" | "none";

function calcEngagement(
  responseCount: number,
  threshold: number
): EngagementLevel {
  if (threshold <= 0) return "none";
  if (responseCount >= threshold) return "green";
  if (responseCount >= Math.max(1, Math.ceil(threshold / 2))) return "yellow";
  if (responseCount > 0) return "red";
  return "none";
}

const ENGAGEMENT_CFG: Record<EngagementLevel, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  green:  { label: "Active",    emoji: "🟢", color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.35)" },
  yellow: { label: "Engaged",   emoji: "🟡", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.35)" },
  red:    { label: "Inactive",  emoji: "🔴", color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)" },
  none:   { label: "No data",   emoji: "⚫", color: "#6b7280", bg: "rgba(107,114,128,0.1)",  border: "rgba(107,114,128,0.2)" },
};

function EngagementBadge({ level, count, threshold }: { level: EngagementLevel; count: number; threshold: number }) {
  if (level === "none" && count === 0) return null;
  const cfg = ENGAGEMENT_CFG[level];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
      title={`${count} surveys in last 30 days (threshold: ${threshold})`}
    >
      {cfg.emoji} {cfg.label}
      {count > 0 && <span className="opacity-70 ml-0.5">({count})</span>}
    </span>
  );
}

// ─── Avatars & source tags ─────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-violet-500/20 text-violet-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-orange-500/20 text-orange-400",
  "bg-rose-500/20 text-rose-400",
  "bg-teal-500/20 text-teal-400",
];

function avatarColor(id: string) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name: string | null, email: string | null) {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

function getSourceTags(source: string, breakdown: Record<string, number>) {
  const tags: { label: string; color: string; icon: React.ReactNode }[] = [];
  if ((breakdown.donation ?? 0) > 0)
    tags.push({ label: "Giver", color: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20", icon: <Heart className="h-2.5 w-2.5" /> });
  if ((breakdown.member ?? 0) > 0)
    tags.push({ label: "Member", color: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20", icon: <UserCircle className="h-2.5 w-2.5" /> });
  if ((breakdown.get_started ?? 0) > 0)
    tags.push({ label: "Get started", color: "bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/20", icon: <TrendingUp className="h-2.5 w-2.5" /> });
  if ((breakdown.form ?? 0) > 0 && tags.length === 0)
    tags.push({ label: "Form", color: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20", icon: <FileText className="h-2.5 w-2.5" /> });
  if ((breakdown.survey ?? 0) > 0)
    tags.push({ label: "Survey", color: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/20", icon: <ClipboardList className="h-2.5 w-2.5" /> });
  if (source === "manual" || (breakdown.manual ?? 0) > 0)
    tags.push({ label: "Manual", color: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20", icon: <UserPlus className="h-2.5 w-2.5" /> });
  if (tags.length === 0)
    tags.push({ label: source, color: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20", icon: <Users className="h-2.5 w-2.5" /> });
  return tags;
}

// ─── Broadcast Modal ──────────────────────────────────────────────────────────

type BroadcastModalProps = {
  contacts: ContactRow[];
  tags: CrmTag[];
  onClose: () => void;
};

function BroadcastModal({ contacts, tags, onClose }: BroadcastModalProps) {
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [filterSource, setFilterSource] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recipientCount = useMemo(() => {
    let eligible = contacts.filter((c) => !c.sources_breakdown?.unsubscribed);
    if (filterSource) eligible = eligible.filter((c) => c.source === filterSource || Object.keys(c.sources_breakdown ?? {}).includes(filterSource));
    return eligible.filter((c) => channel === "email" ? c.email?.trim() : c.phone?.trim()).length;
  }, [contacts, channel, filterSource, filterTagIds]);

  async function handleSend() {
    if (!body.trim()) { setError("Message body is required."); return; }
    if (channel === "email" && !subject.trim()) { setError("Subject is required for emails."); return; }
    setError(null); setSending(true);
    try {
      const res = await fetch("/api/crm/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, subject, body, filterTagIds, filterSource: filterSource || undefined }),
      });
      const data = await res.json() as { ok?: boolean; sent?: number; total?: number; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to send"); return; }
      setResult({ sent: data.sent ?? 0, total: data.total ?? 0 });
    } catch { setError("Something went wrong."); }
    finally { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-dashboard-border bg-dashboard-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-dashboard-border px-6 py-4">
          <div className="flex items-center gap-2"><Send className="h-5 w-5 text-emerald-400" /><h2 className="text-base font-semibold text-dashboard-text">Broadcast message</h2></div>
          <button onClick={onClose} className="rounded p-1 text-dashboard-text-muted hover:text-dashboard-text"><X className="h-5 w-5" /></button>
        </div>
        {result ? (
          <div className="p-8 text-center">
            <div className="mb-4 mx-auto h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center"><Send className="h-7 w-7 text-emerald-400" /></div>
            <h3 className="text-lg font-bold text-dashboard-text">Broadcast sent!</h3>
            <p className="mt-2 text-dashboard-text-muted">Delivered to <strong className="text-dashboard-text">{result.sent}</strong> of {result.total} recipients.</p>
            <Button onClick={onClose} className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white">Done</Button>
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {(["email", "sms"] as const).map((c) => (
                <button key={c} onClick={() => setChannel(c)} className={["flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all", channel === c ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text"].join(" ")}>
                  {c === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  {c === "email" ? "Email" : "SMS"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-dashboard-text-muted uppercase tracking-wider">Source filter</label>
                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text focus:outline-none">
                  <option value="">All contacts</option>
                  <option value="donation">Givers</option>
                  <option value="member">Members</option>
                  <option value="form">Form submitters</option>
                  <option value="survey">Survey respondents</option>
                  <option value="manual">Manually added</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-dashboard-text-muted uppercase tracking-wider">Tag filter</label>
                <select multiple value={filterTagIds} onChange={(e) => setFilterTagIds(Array.from(e.target.selectedOptions, (o) => o.value))} className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text focus:outline-none min-h-[38px]">
                  {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-dashboard-text-muted">Recipients: <strong className="text-dashboard-text">{recipientCount}</strong></p>
            {channel === "email" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-dashboard-text">Subject</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-dashboard-text">Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" rows={5} className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none" />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <Button onClick={handleSend} disabled={sending || recipientCount === 0} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                {sending ? "Sending…" : `Send to ${recipientCount}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tag Manager ──────────────────────────────────────────────────────────────

const TAG_COLOR_OPTIONS = ["#6366f1", "#0d9488", "#2563eb", "#dc2626", "#d97706", "#7c3aed", "#db2777", "#16a34a"];

function TagManager({ tags, onClose, onTagsChanged }: { tags: CrmTag[]; onClose: () => void; onTagsChanged: () => void }) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLOR_OPTIONS[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) { setError("Tag name required."); return; }
    setError(null); setCreating(true);
    try {
      const res = await fetch("/api/crm/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim(), color: newColor }) });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setNewName(""); onTagsChanged();
    } catch { setError("Something went wrong."); }
    finally { setCreating(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-dashboard-border bg-dashboard-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-dashboard-border px-6 py-4">
          <div className="flex items-center gap-2"><Tag className="h-5 w-5 text-violet-400" /><h2 className="text-base font-semibold text-dashboard-text">Manage tags</h2></div>
          <button onClick={onClose} className="rounded p-1 text-dashboard-text-muted hover:text-dashboard-text"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <div><p className="mb-2 text-xs font-semibold text-dashboard-text-muted">Tag color</p>
              <div className="flex flex-wrap gap-2">
                {TAG_COLOR_OPTIONS.map((c) => (
                  <button key={c} type="button" onClick={() => setNewColor(c)} className={`h-7 w-7 rounded-full transition-transform ${newColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-dashboard-card scale-110" : "opacity-70 hover:opacity-100"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New tag name…" className="flex-1 rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
              <Button type="submit" disabled={creating} size="sm" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-4">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}</Button>
            </div>
          </form>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {tags.length === 0 && <p className="text-sm text-center text-dashboard-text-muted py-4">No tags yet.</p>}
            {tags.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-dashboard-border bg-dashboard-card-hover/50 px-3 py-2">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} /><span className="text-sm text-dashboard-text">{t.name}</span></div>
                <button onClick={() => { fetch(`/api/crm/tags/${t.id}`, { method: "DELETE" }).then(onTagsChanged); }} className="text-dashboard-text-muted hover:text-rose-400"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Engagement Threshold Widget ──────────────────────────────────────────────

function EngagementThresholdWidget({
  threshold,
  onChange,
  counts,
}: {
  threshold: number;
  onChange: (v: number) => void;
  counts: { green: number; yellow: number; red: number; none: number; total: number };
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(String(threshold));

  const applyEdit = () => {
    const n = Math.max(1, Number(localVal) || threshold);
    onChange(n);
    setEditing(false);
  };

  return (
    <div
      className="rounded-2xl p-4 dashboard-fade-in-delay-1 flex flex-wrap gap-4 items-center justify-between"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Tiers */}
      <div className="flex items-center gap-4 flex-wrap">
        {(["green", "yellow", "red", "none"] as const).map((k) => {
          const cfg = ENGAGEMENT_CFG[k];
          return (
            <div key={k} className="flex items-center gap-1.5 text-sm">
              <span>{cfg.emoji}</span>
              <span className="font-bold" style={{ color: cfg.color }}>{counts[k]}</span>
              <span className="text-dashboard-text-muted text-xs">{cfg.label}</span>
            </div>
          );
        })}
        {/* Engagement bar */}
        {counts.total > 0 && (
          <div className="flex gap-0.5 h-2 w-32 rounded-full overflow-hidden">
            {(["green", "yellow", "red"] as const).map((k) => (
              <div key={k} className="rounded-full" style={{ width: `${(counts[k] / counts.total) * 100}%`, background: ENGAGEMENT_CFG[k].color }} />
            ))}
          </div>
        )}
      </div>

      {/* Threshold control */}
      <div className="flex items-center gap-2 text-sm">
        <Settings2 className="h-3.5 w-3.5 text-dashboard-text-muted shrink-0" />
        <span className="text-dashboard-text-muted text-xs">Active threshold:</span>
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              value={localVal}
              onChange={(e) => setLocalVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyEdit()}
              className="w-14 rounded-lg border border-dashboard-border bg-dashboard-card px-2 py-1 text-xs text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              autoFocus
            />
            <span className="text-xs text-dashboard-text-muted">surveys/mo</span>
            <button onClick={applyEdit} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-1">Save</button>
          </div>
        ) : (
          <button
            onClick={() => { setLocalVal(String(threshold)); setEditing(true); }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {threshold} surveys/mo
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PeoplePageClient({
  contacts,
  initialTags,
  surveyResponseCounts,
}: {
  contacts: ContactRow[];
  initialTags: CrmTag[];
  surveyResponseCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [engagementFilter, setEngagementFilter] = useState<EngagementFilter>("all");
  const [search, setSearch] = useState("");
  const [threshold, setThreshold] = useState(4);
  const [showAdd, setShowAdd] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [tags, setTags] = useState<CrmTag[]>(initialTags);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Persist threshold
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THRESHOLD_KEY);
      if (saved) setThreshold(Math.max(1, Number(saved)));
    } catch {}
  }, []);
  const setAndSaveThreshold = useCallback((v: number) => {
    setThreshold(v);
    try { localStorage.setItem(THRESHOLD_KEY, String(v)); } catch {}
  }, []);

  // Compute engagement for every contact
  const engagementMap = useMemo<Record<string, EngagementLevel>>(() => {
    const map: Record<string, EngagementLevel> = {};
    for (const c of contacts) {
      const key = c.email?.toLowerCase().trim() ?? "";
      const count = key ? (surveyResponseCounts[key] ?? 0) : 0;
      map[c.id] = calcEngagement(count, threshold);
    }
    return map;
  }, [contacts, surveyResponseCounts, threshold]);

  // Engagement counts
  const engagementCounts = useMemo(() => {
    const counts = { green: 0, yellow: 0, red: 0, none: 0, total: contacts.length };
    for (const level of Object.values(engagementMap)) counts[level]++;
    return counts;
  }, [engagementMap, contacts.length]);

  const totalDonors  = contacts.filter((c) => (c.sources_breakdown?.donation ?? 0) > 0).length;
  const totalMembers = contacts.filter((c) => (c.sources_breakdown?.member ?? 0) > 0 || (c.sources_breakdown?.get_started ?? 0) > 0).length;
  const totalForm    = contacts.filter((c) => (c.sources_breakdown?.form ?? 0) > 0).length;
  const totalSurvey  = contacts.filter((c) => (c.sources_breakdown?.survey ?? 0) > 0).length;
  const totalManual  = contacts.filter((c) => c.source === "manual" || (c.sources_breakdown?.manual ?? 0) > 0).length;

  const tabDefs: { id: Tab; label: string; count: number; icon: React.ReactNode; color: string }[] = [
    { id: "all",     label: "All",            count: contacts.length, icon: <Users className="h-3.5 w-3.5" />,        color: "text-dashboard-text" },
    { id: "givers",  label: "Givers",         count: totalDonors,     icon: <Heart className="h-3.5 w-3.5" />,        color: "text-blue-400" },
    { id: "members", label: "Members",        count: totalMembers,    icon: <UserCircle className="h-3.5 w-3.5" />,   color: "text-emerald-400" },
    { id: "form",    label: "Form",           count: totalForm,       icon: <FileText className="h-3.5 w-3.5" />,     color: "text-violet-400" },
    { id: "survey",  label: "Survey",         count: totalSurvey,     icon: <ClipboardList className="h-3.5 w-3.5" />,color: "text-orange-400" },
    { id: "manual",  label: "Added manually", count: totalManual,     icon: <UserPlus className="h-3.5 w-3.5" />,     color: "text-slate-400" },
  ];

  const visible = useMemo(() => {
    let list = contacts;
    if (tab !== "all") {
      list = list.filter((c) => {
        const b = c.sources_breakdown ?? {};
        if (tab === "givers")  return (b.donation ?? 0) > 0;
        if (tab === "members") return (b.member ?? 0) > 0 || (b.get_started ?? 0) > 0;
        if (tab === "form")    return (b.form ?? 0) > 0;
        if (tab === "survey")  return (b.survey ?? 0) > 0;
        if (tab === "manual")  return c.source === "manual" || (b.manual ?? 0) > 0;
        return true;
      });
    }
    if (engagementFilter !== "all") {
      list = list.filter((c) => engagementMap[c.id] === engagementFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
      );
    }
    return list;
  }, [contacts, tab, engagementFilter, search, engagementMap]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!form.name.trim() && !form.email.trim()) { setAddError("Enter at least a name or email."); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/organization-contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setAddError(data.error ?? "Failed to add contact"); return; }
      setShowAdd(false); setForm({ name: "", email: "", phone: "" }); router.refresh();
    } catch { setAddError("Something went wrong."); }
    finally { setAdding(false); }
  }

  const refreshTags = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/tags");
      const data = await res.json() as { tags?: CrmTag[] };
      setTags(data.tags ?? []);
    } catch {}
  }, []);

  return (
    <div className="space-y-5 p-3 sm:p-5">
      {/* Header */}
      <div className="dashboard-fade-in flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Users className="h-4 w-4 text-violet-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-dashboard-text">People</h1>
            {contacts.length > 0 && (
              <span className="rounded-full bg-violet-500/15 text-violet-400 text-xs font-bold px-2.5 py-0.5">
                {contacts.length}
              </span>
            )}
          </div>
          <p className="text-sm text-dashboard-text-muted">
            Your CRM — everyone connected to your organization. Engagement based on survey responses (last 30 days).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button onClick={() => setShowTagManager(true)} variant="secondary" size="sm" className="gap-1.5"><Tag className="h-3.5 w-3.5" /> Tags</Button>
          <Button onClick={() => setShowBroadcast(true)} variant="secondary" size="sm" className="gap-1.5"><Send className="h-3.5 w-3.5" /> Broadcast</Button>
          <Button onClick={() => setShowAdd(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm"><UserPlus className="h-4 w-4" /> Add person</Button>
        </div>
      </div>

      {/* Engagement widget */}
      <EngagementThresholdWidget
        threshold={threshold}
        onChange={setAndSaveThreshold}
        counts={engagementCounts}
      />

      {/* Stats row */}
      <div className="dashboard-fade-in-delay-1 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tabDefs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setEngagementFilter("all"); }}
            className={["rounded-xl border p-4 text-left transition-all shadow-sm", tab === t.id && engagementFilter === "all" ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20" : "border-dashboard-border bg-dashboard-card hover:border-dashboard-border/80 hover:bg-dashboard-card-hover"].join(" ")}
          >
            <div className={`mb-2 inline-flex rounded-lg p-1.5 ${tab === t.id ? "bg-emerald-500/15" : "bg-dashboard-card-hover"} ${t.color}`}>{t.icon}</div>
            <p className={`text-2xl font-bold tabular-nums ${t.color}`}>{t.count}</p>
            <p className="mt-0.5 text-xs text-dashboard-text-muted">{t.label}</p>
          </button>
        ))}
      </div>

      {/* Engagement filter chips */}
      <div className="flex flex-wrap gap-2 dashboard-fade-in-delay-2">
        <span className="text-xs text-dashboard-text-muted self-center">Engagement:</span>
        {(["all", "green", "yellow", "red", "none"] as EngagementFilter[]).map((e) => {
          const isAll = e === "all";
          const cfg = isAll ? null : ENGAGEMENT_CFG[e];
          const count = isAll
            ? contacts.length
            : Object.values(engagementMap).filter((v) => v === e).length;
          const active = engagementFilter === e;
          return (
            <button
              key={e}
              type="button"
              onClick={() => setEngagementFilter(e)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
              style={active ? {
                background: cfg ? cfg.bg : "rgba(255,255,255,0.1)",
                color: cfg ? cfg.color : "hsl(var(--dashboard-text))",
                border: `1px solid ${cfg ? cfg.border : "rgba(255,255,255,0.15)"}`,
              } : {
                color: "hsl(var(--dashboard-text-muted))",
                border: "1px solid transparent",
              }}
            >
              {isAll ? `All (${count})` : `${cfg!.emoji} ${cfg!.label} (${count})`}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="dashboard-fade-in-delay-2 rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
        <div className="border-b border-dashboard-border px-5 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dashboard-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover pl-9 pr-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <span className="rounded-full bg-dashboard-card-hover px-2.5 py-0.5 text-xs text-dashboard-text-muted">
            {visible.length} {visible.length === 1 ? "person" : "people"}
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="mb-4 rounded-2xl bg-violet-500/10 p-4"><Users className="h-8 w-8 text-violet-400" /></div>
            <h3 className="text-base font-semibold text-dashboard-text">
              {contacts.length === 0 ? "No contacts yet" : search ? "No results found" : "No contacts match these filters"}
            </h3>
            <p className="mt-1.5 max-w-xs text-sm text-dashboard-text-muted">
              {contacts.length === 0
                ? "Add someone manually or contacts appear when someone gives or fills a form."
                : "Try a different filter combination."}
            </p>
            {!search && engagementFilter === "all" && (
              <Button onClick={() => setShowAdd(true)} className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                <UserPlus className="h-4 w-4" /> Add person
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dashboard-border bg-dashboard-card-hover/30">
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Name</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Email</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted hidden sm:table-cell">Phone</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Groups</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Engagement</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted hidden md:table-cell">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const stags    = getSourceTags(c.source, c.sources_breakdown ?? {});
                  const init     = initials(c.name, c.email);
                  const aColor   = avatarColor(c.id);
                  const level    = engagementMap[c.id] ?? "none";
                  const emailKey = c.email?.toLowerCase().trim() ?? "";
                  const count    = emailKey ? (surveyResponseCounts[emailKey] ?? 0) : 0;
                  const engBorder = level !== "none"
                    ? ENGAGEMENT_CFG[level].color + "40"
                    : "transparent";

                  return (
                    <tr
                      key={c.id}
                      className="border-t border-dashboard-border transition-colors hover:bg-dashboard-card-hover/40"
                      style={{ borderLeft: `3px solid ${engBorder}` }}
                    >
                      <td className="p-3">
                        <Link href={`/dashboard/people/${c.id}`} className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${aColor}`}
                            style={level !== "none" ? { boxShadow: `0 0 0 2px ${ENGAGEMENT_CFG[level].color}40` } : {}}
                          >
                            {init}
                          </div>
                          <span className="font-medium text-dashboard-text hover:underline">
                            {c.name?.trim() || <span className="text-dashboard-text-muted italic">No name</span>}
                          </span>
                        </Link>
                      </td>
                      <td className="p-3 text-dashboard-text-muted">
                        <Link href={`/dashboard/people/${c.id}`} className="hover:underline">{c.email ?? "—"}</Link>
                      </td>
                      <td className="p-3 text-dashboard-text-muted hidden sm:table-cell">{c.phone?.trim() || "—"}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {stags.map((t) => (
                            <span key={t.label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.color}`}>{t.icon}{t.label}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <EngagementBadge level={level} count={count} threshold={threshold} />
                      </td>
                      <td className="p-3 text-dashboard-text-muted hidden md:table-cell">
                        {c.last_seen_at ? new Date(c.last_seen_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add person modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-dashboard-border bg-dashboard-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-dashboard-border px-6 py-4">
              <div className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-emerald-400" /><h2 className="text-base font-semibold text-dashboard-text">Add person</h2></div>
              <button onClick={() => { setShowAdd(false); setAddError(null); }} className="rounded p-1 text-dashboard-text-muted hover:text-dashboard-text"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-dashboard-text">Full name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="John Smith" className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-dashboard-text">Email address</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="john@example.com" className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-dashboard-text">Phone <span className="text-dashboard-text-muted font-normal">(optional)</span></label>
                <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
              </div>
              {addError && <p className="text-sm text-rose-400">{addError}</p>}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" onClick={() => { setShowAdd(false); setAddError(null); }} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={adding} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">{adding && <Loader2 className="h-4 w-4 animate-spin" />}{adding ? "Adding…" : "Add person"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBroadcast && <BroadcastModal contacts={contacts} tags={tags} onClose={() => setShowBroadcast(false)} />}
      {showTagManager && <TagManager tags={tags} onClose={() => setShowTagManager(false)} onTagsChanged={refreshTags} />}
    </div>
  );
}
