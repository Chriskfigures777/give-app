"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, TrendingUp, Heart, FileText, ClipboardList,
  UserCircle, UserPlus, X, Loader2, Search, Tag, Send,
  Mail, MessageSquare, Settings2, ChevronDown, SlidersHorizontal,
  Check, ShieldCheck, ShieldX,
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

function calcEngagement(responseCount: number, threshold: number): EngagementLevel {
  if (threshold <= 0) return "none";
  if (responseCount >= threshold) return "green";
  if (responseCount >= Math.max(1, Math.ceil(threshold / 2))) return "yellow";
  if (responseCount > 0) return "red";
  return "none";
}

const ENGAGEMENT_CFG: Record<EngagementLevel, { label: string; color: string; bg: string; border: string; dot: string }> = {
  green:  { label: "Active",   dot: "🟢", color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.35)" },
  yellow: { label: "Engaged",  dot: "🟡", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.35)" },
  red:    { label: "Inactive", dot: "🔴", color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)" },
  none:   { label: "No data",  dot: "⚫", color: "#6b7280", bg: "rgba(107,114,128,0.1)",  border: "rgba(107,114,128,0.2)" },
};

// ─── Avatars ──────────────────────────────────────────────────────────────────

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
  const tags: { label: string; color: string }[] = [];
  if ((breakdown.donation ?? 0) > 0)
    tags.push({ label: "Giver",      color: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20" });
  if ((breakdown.member ?? 0) > 0)
    tags.push({ label: "Member",     color: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20" });
  if ((breakdown.get_started ?? 0) > 0)
    tags.push({ label: "Get started",color: "bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/20" });
  if ((breakdown.form ?? 0) > 0 && tags.length === 0)
    tags.push({ label: "Form",       color: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20" });
  if ((breakdown.survey ?? 0) > 0)
    tags.push({ label: "Survey",     color: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/20" });
  if (source === "manual" || (breakdown.manual ?? 0) > 0)
    tags.push({ label: "Manual",     color: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20" });
  if (tags.length === 0)
    tags.push({ label: source,       color: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20" });
  return tags;
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const isFiltered = value !== options[0].value;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all whitespace-nowrap",
          isFiltered
            ? "border-emerald-500/40 bg-emerald-500/8 text-emerald-400"
            : "border-dashboard-border bg-dashboard-card text-dashboard-text-muted hover:text-dashboard-text hover:border-dashboard-border/80",
        ].join(" ")}
      >
        <span className="text-xs text-dashboard-text-muted font-medium">{label}:</span>
        <span className={isFiltered ? "text-emerald-400 font-semibold" : "text-dashboard-text font-medium"}>{selected?.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1.5 min-w-[180px] rounded-xl border border-dashboard-border bg-dashboard-card shadow-2xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm text-left hover:bg-dashboard-card-hover transition-colors"
            >
              <span className={opt.value === value ? "text-emerald-400 font-semibold" : "text-dashboard-text"}>{opt.label}</span>
              <div className="flex items-center gap-2">
                {opt.count !== undefined && (
                  <span className="text-xs font-medium text-dashboard-text-muted tabular-nums">{opt.count}</span>
                )}
                {opt.value === value && <Check className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Broadcast Modal ──────────────────────────────────────────────────────────

function BroadcastModal({ contacts, tags, onClose }: { contacts: ContactRow[]; tags: CrmTag[]; onClose: () => void }) {
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
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [localThreshold, setLocalThreshold] = useState("4");
  const [showAdd, setShowAdd] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [tags, setTags] = useState<CrmTag[]>(initialTags);
  const [form, setForm] = useState({ name: "", email: "", phone: "", asMember: false });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const thresholdRef = useRef<HTMLDivElement>(null);
  // Track per-contact member promotion state: "loading" | "done" | "removed"
  const [memberState, setMemberState] = useState<Record<string, "loading" | "done" | "removed">>({});

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (thresholdRef.current && !thresholdRef.current.contains(e.target as Node)) {
        setEditingThreshold(false);
      }
    }
    if (editingThreshold) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [editingThreshold]);

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

  const engagementMap = useMemo<Record<string, EngagementLevel>>(() => {
    const map: Record<string, EngagementLevel> = {};
    for (const c of contacts) {
      const key = c.email?.toLowerCase().trim() ?? "";
      const count = key ? (surveyResponseCounts[key] ?? 0) : 0;
      map[c.id] = calcEngagement(count, threshold);
    }
    return map;
  }, [contacts, surveyResponseCounts, threshold]);

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

  const sourceOptions: { value: Tab; label: string; count: number }[] = [
    { value: "all",     label: "All contacts",   count: contacts.length },
    { value: "givers",  label: "Givers",          count: totalDonors },
    { value: "members", label: "Members",         count: totalMembers },
    { value: "form",    label: "Form",            count: totalForm },
    { value: "survey",  label: "Survey",          count: totalSurvey },
    { value: "manual",  label: "Added manually",  count: totalManual },
  ];

  const engagementOptions: { value: EngagementFilter; label: string; count: number }[] = [
    { value: "all",    label: "All engagement",   count: contacts.length },
    { value: "green",  label: "🟢 Active",         count: engagementCounts.green },
    { value: "yellow", label: "🟡 Engaged",        count: engagementCounts.yellow },
    { value: "red",    label: "🔴 Inactive",       count: engagementCounts.red },
    { value: "none",   label: "⚫ No data",        count: engagementCounts.none },
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

  const activeFilters = (tab !== "all" ? 1 : 0) + (engagementFilter !== "all" ? 1 : 0) + (search.trim() ? 1 : 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!form.name.trim() && !form.email.trim()) { setAddError("Enter at least a name or email."); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/organization-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, asMember: form.asMember }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setAddError(data.error ?? "Failed to add contact"); return; }
      setShowAdd(false); setForm({ name: "", email: "", phone: "", asMember: false }); router.refresh();
    } catch { setAddError("Something went wrong."); }
    finally { setAdding(false); }
  }

  async function toggleMember(contactId: string, currentlyMember: boolean) {
    setMemberState((p) => ({ ...p, [contactId]: "loading" }));
    try {
      const res = await fetch("/api/organization-contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contactId, addMember: !currentlyMember, removeMember: currentlyMember }),
      });
      if (!res.ok) { setMemberState((p) => { const n = { ...p }; delete n[contactId]; return n; }); return; }
      setMemberState((p) => ({ ...p, [contactId]: currentlyMember ? "removed" : "done" }));
      router.refresh();
    } catch {
      setMemberState((p) => { const n = { ...p }; delete n[contactId]; return n; });
    }
  }

  const refreshTags = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/tags");
      const data = await res.json() as { tags?: CrmTag[] };
      setTags(data.tags ?? []);
    } catch {}
  }, []);

  function applyThreshold() {
    const n = Math.max(1, Number(localThreshold) || threshold);
    setAndSaveThreshold(n);
    setEditingThreshold(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 pt-5 pb-4 border-b border-dashboard-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-dashboard-text">People</h1>
              <span className="rounded-full bg-dashboard-card-hover px-2 py-0.5 text-xs font-semibold text-dashboard-text-muted">
                {contacts.length}
              </span>
            </div>
            <p className="text-xs text-dashboard-text-muted leading-tight">
              Your CRM — engagement from survey responses (last 30 days)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button onClick={() => setShowTagManager(true)} variant="secondary" size="sm" className="gap-1.5 text-xs">
            <Tag className="h-3.5 w-3.5" /> Tags
          </Button>
          <Button onClick={() => setShowBroadcast(true)} variant="secondary" size="sm" className="gap-1.5 text-xs">
            <Send className="h-3.5 w-3.5" /> Broadcast
          </Button>
          <Button onClick={() => setShowAdd(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" size="sm">
            <UserPlus className="h-3.5 w-3.5" /> Add person
          </Button>
        </div>
      </div>

      {/* ── Filter toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 border-b border-dashboard-border bg-dashboard-card/40">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dashboard-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full rounded-lg border border-dashboard-border bg-dashboard-card pl-9 pr-4 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-dashboard-text-muted hover:text-dashboard-text">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Source filter */}
        <FilterDropdown<Tab>
          label="Source"
          value={tab}
          options={sourceOptions}
          onChange={(v) => setTab(v)}
        />

        {/* Engagement filter */}
        <FilterDropdown<EngagementFilter>
          label="Engagement"
          value={engagementFilter}
          options={engagementOptions}
          onChange={(v) => setEngagementFilter(v)}
        />

        {/* Threshold popover */}
        <div ref={thresholdRef} className="relative">
          <button
            onClick={() => { setLocalThreshold(String(threshold)); setEditingThreshold((v) => !v); }}
            className={[
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all whitespace-nowrap",
              editingThreshold
                ? "border-emerald-500/40 bg-emerald-500/8 text-emerald-400"
                : "border-dashboard-border bg-dashboard-card text-dashboard-text-muted hover:text-dashboard-text hover:border-dashboard-border/80",
            ].join(" ")}
          >
            <Settings2 className="h-3.5 w-3.5 opacity-70" />
            <span className="text-xs text-dashboard-text-muted font-medium">Active threshold:</span>
            <span className="font-semibold text-dashboard-text">≥{threshold} surveys/mo</span>
          </button>
          {editingThreshold && (
            <div className="absolute top-full left-0 z-30 mt-2 w-72 rounded-xl border border-dashboard-border bg-dashboard-card shadow-2xl p-4">
              <p className="text-sm font-semibold text-dashboard-text mb-1">Set active threshold</p>
              <p className="text-xs text-dashboard-text-muted mb-4 leading-relaxed">
                Members who complete this many or more surveys per month are counted as <span className="text-emerald-400 font-medium">Active</span>.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="number"
                  min={1}
                  value={localThreshold}
                  onChange={(e) => setLocalThreshold(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") applyThreshold(); if (e.key === "Escape") setEditingThreshold(false); }}
                  className="w-20 rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  autoFocus
                />
                <span className="text-sm text-dashboard-text-muted">surveys per month</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyThreshold}
                  className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingThreshold(false)}
                  className="flex-1 rounded-lg border border-dashboard-border text-dashboard-text text-sm py-2 hover:bg-dashboard-card-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clear filters */}
        {activeFilters > 0 && (
          <button
            onClick={() => { setTab("all"); setEngagementFilter("all"); setSearch(""); }}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/8 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/12 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
          </button>
        )}

        {/* Count */}
        <div className="ml-auto">
          <span className="rounded-full bg-dashboard-card-hover px-3 py-1 text-xs font-semibold text-dashboard-text-muted">
            {visible.length} {visible.length === 1 ? "person" : "people"}
          </span>
        </div>
      </div>

      {/* ── Engagement summary bar ────────────────────────────────────────────── */}
      {contacts.length > 0 && (
        <div className="flex items-center gap-4 px-5 py-2 border-b border-dashboard-border/50 bg-dashboard-card/20">
          {(["green", "yellow", "red", "none"] as const).map((k) => {
            const cfg = ENGAGEMENT_CFG[k];
            const count = engagementCounts[k];
            const pct = contacts.length > 0 ? Math.round((count / contacts.length) * 100) : 0;
            return (
              <button
                key={k}
                onClick={() => setEngagementFilter(engagementFilter === k ? "all" : k)}
                className={`flex items-center gap-1.5 text-sm transition-opacity ${engagementFilter !== "all" && engagementFilter !== k ? "opacity-40" : ""}`}
              >
                <span className="text-xs">{cfg.dot}</span>
                <span className="font-semibold" style={{ color: cfg.color }}>{count}</span>
                <span className="text-dashboard-text-muted">{cfg.label}</span>
                <span className="text-dashboard-text-muted opacity-60">({pct}%)</span>
              </button>
            );
          })}
          {contacts.length > 0 && (
            <div className="ml-auto flex gap-0.5 h-1.5 w-24 rounded-full overflow-hidden">
              {(["green", "yellow", "red"] as const).map((k) => (
                <div
                  key={k}
                  className="transition-all rounded-full"
                  style={{ width: `${(engagementCounts[k] / contacts.length) * 100}%`, background: ENGAGEMENT_CFG[k].color }}
                />
              ))}
              <div className="flex-1 rounded-full bg-dashboard-border" />
            </div>
          )}
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="mb-4 rounded-2xl bg-violet-500/10 p-4">
              <Users className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-base font-semibold text-dashboard-text">
              {contacts.length === 0 ? "No contacts yet" : search ? "No results found" : "No contacts match these filters"}
            </h3>
            <p className="mt-1.5 max-w-xs text-sm text-dashboard-text-muted">
              {contacts.length === 0
                ? "Add someone manually or contacts appear when someone gives or fills a form."
                : "Try adjusting your filters."}
            </p>
            {contacts.length === 0 && (
              <Button onClick={() => setShowAdd(true)} className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                <UserPlus className="h-4 w-4" /> Add person
              </Button>
            )}
            {activeFilters > 0 && (
              <button
                onClick={() => { setTab("all"); setEngagementFilter("all"); setSearch(""); }}
                className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm border-collapse border border-dashboard-border">
            <thead className="sticky top-0 z-10">
              <tr style={{ background: "var(--dashboard-card-hover, rgba(255,255,255,0.04))" }}>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-dashboard-text-muted border border-dashboard-border w-[220px]">
                  Name
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-dashboard-text-muted border border-dashboard-border">
                  Email
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-dashboard-text-muted border border-dashboard-border hidden sm:table-cell">
                  Phone
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-dashboard-text-muted border border-dashboard-border">
                  Source
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-dashboard-text-muted border border-dashboard-border">
                  Engagement
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-dashboard-text-muted border border-dashboard-border hidden md:table-cell">
                  Last seen
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-dashboard-text-muted border border-dashboard-border">
                  Member
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c, i) => {
                const stags    = getSourceTags(c.source, c.sources_breakdown ?? {});
                const init     = initials(c.name, c.email);
                const aColor   = avatarColor(c.id);
                const level    = engagementMap[c.id] ?? "none";
                const emailKey = c.email?.toLowerCase().trim() ?? "";
                const count    = emailKey ? (surveyResponseCounts[emailKey] ?? 0) : 0;
                const cfg      = ENGAGEMENT_CFG[level];

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-dashboard-card-hover/40 transition-colors group ${i % 2 === 1 ? "bg-white/[0.02]" : ""}`}
                  >
                    {/* Name */}
                    <td className="px-4 py-2.5 border border-dashboard-border">
                      <Link href={`/dashboard/people/${c.id}`} className="flex items-center gap-2.5">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${aColor}`}>
                          {init}
                        </div>
                        <span className="font-medium text-dashboard-text group-hover:text-emerald-400 transition-colors text-[13px]">
                          {c.name?.trim() || <span className="text-dashboard-text-muted italic font-normal">No name</span>}
                        </span>
                      </Link>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-2.5 border border-dashboard-border">
                      <Link href={`/dashboard/people/${c.id}`} className="text-[13px] text-dashboard-text-muted hover:text-dashboard-text transition-colors">
                        {c.email ?? <span className="opacity-30">—</span>}
                      </Link>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-2.5 text-[13px] text-dashboard-text-muted border border-dashboard-border hidden sm:table-cell">
                      {c.phone?.trim() || <span className="opacity-30">—</span>}
                    </td>

                    {/* Source tags */}
                    <td className="px-4 py-2.5 border border-dashboard-border">
                      <div className="flex flex-wrap gap-1">
                        {stags.map((t) => (
                          <span key={t.label} className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${t.color}`}>
                            {t.label}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Engagement */}
                    <td className="px-4 py-2.5 border border-dashboard-border">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px]">{cfg.dot}</span>
                        <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                        {count > 0 && (
                          <span className="text-[10px] text-dashboard-text-muted">({count})</span>
                        )}
                      </div>
                    </td>

                    {/* Last seen */}
                    <td className="px-4 py-2.5 text-[12px] text-dashboard-text-muted border border-dashboard-border hidden md:table-cell">
                      {c.last_seen_at
                        ? new Date(c.last_seen_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                        : <span className="opacity-30">—</span>}
                    </td>

                    {/* Member toggle */}
                    <td className="px-4 py-2.5 text-right border border-dashboard-border" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const isMember = (c.sources_breakdown?.member ?? 0) > 0;
                        const state = memberState[c.id];
                        if (state === "loading") return (
                          <span className="inline-flex items-center gap-1 text-xs text-dashboard-text-muted">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          </span>
                        );
                        if (isMember) return (
                          <button
                            type="button"
                            title="Remove member status"
                            onClick={() => toggleMember(c.id, true)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 hover:bg-rose-500/15 hover:border-rose-500/25 hover:text-rose-400 transition-all group"
                          >
                            <ShieldCheck className="h-3 w-3 group-hover:hidden" />
                            <ShieldX className="h-3 w-3 hidden group-hover:block" />
                            <span className="group-hover:hidden">Member</span>
                            <span className="hidden group-hover:inline">Remove</span>
                          </button>
                        );
                        return (
                          <button
                            type="button"
                            title="Add as member"
                            onClick={() => toggleMember(c.id, false)}
                            className="inline-flex items-center gap-1 rounded-lg border border-dashboard-border px-2.5 py-1 text-[10px] font-semibold text-dashboard-text-muted hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                          >
                            <ShieldCheck className="h-3 w-3" /> Make Member
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add person modal ──────────────────────────────────────────────────── */}
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

              {/* Member toggle */}
              <label className="flex items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 px-4 py-3 cursor-pointer hover:bg-dashboard-card-hover transition-colors">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={form.asMember}
                    onChange={(e) => setForm((f) => ({ ...f, asMember: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${form.asMember ? "bg-emerald-500 border-emerald-500" : "border-dashboard-border bg-dashboard-card"}`}>
                    {form.asMember && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dashboard-text flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Add as Member
                  </p>
                  <p className="text-xs text-dashboard-text-muted">Marks this person under the Members source filter</p>
                </div>
              </label>

              {addError && <p className="text-sm text-rose-400">{addError}</p>}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" onClick={() => { setShowAdd(false); setAddError(null); }} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={adding} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                  {adding ? "Adding…" : "Add person"}
                </Button>
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
