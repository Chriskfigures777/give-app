"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Phone, Plus, Pencil, Trash2, X, Sparkles,
  Calendar, Clock, User, BookOpen, CheckCircle2,
  Circle, AlertCircle, ChevronDown, Printer,
  Filter, TrendingUp, Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type CallStatus = "upcoming" | "completed" | "missed" | "rescheduled";
type EngagementLevel = "green" | "yellow" | "red" | null;

type PrivateCall = {
  id: string;
  member_name: string;
  member_email?: string;
  scheduled_date: string;
  duration_minutes?: number;
  topic?: string;
  notes?: string;
  status: CallStatus;
  engagement: EngagementLevel;
  follow_up?: string;
  created_at: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "give_private_calls_v1";

const STATUS_CONFIG: Record<CallStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  upcoming:    { label: "Upcoming",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: Clock },
  completed:   { label: "Completed",   color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: CheckCircle2 },
  missed:      { label: "Missed",      color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: AlertCircle },
  rescheduled: { label: "Rescheduled", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: Calendar },
};

const ENGAGEMENT_CONFIG: Record<NonNullable<EngagementLevel>, { label: string; color: string; bg: string; border: string; emoji: string; desc: string }> = {
  green:  { label: "Active",    color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.35)",  emoji: "🟢", desc: "Highly engaged" },
  yellow: { label: "Engaged",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.35)",  emoji: "🟡", desc: "Needs attention" },
  red:    { label: "Inactive",  color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)",   emoji: "🔴", desc: "At-risk, follow up" },
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadCalls(): PrivateCall[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCalls(calls: PrivateCall[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(calls)); } catch {}
}

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysFromNow(d: string): number {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Engagement Badge ────────────────────────────────────────────────────────

function EngagementBadge({ level }: { level: EngagementLevel }) {
  if (!level) return null;
  const cfg = ENGAGEMENT_CONFIG[level];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CallStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── Call Card ────────────────────────────────────────────────────────────────

function CallCard({
  call,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  call: PrivateCall;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: CallStatus) => void;
}) {
  const days = daysFromNow(call.scheduled_date);
  const engagementColor = call.engagement ? ENGAGEMENT_CONFIG[call.engagement].color : "transparent";

  return (
    <div
      className="group relative flex flex-col gap-3 rounded-2xl p-4 transition-all hover:shadow-lg"
      style={{
        background: "hsl(var(--dashboard-card))",
        border: `1.5px solid rgba(255,255,255,0.07)`,
        borderLeft: `4px solid ${engagementColor}`,
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${engagementColor || "#6b7280"}, ${engagementColor || "#6b7280"}99)` }}
          >
            {call.member_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-dashboard-text truncate">{call.member_name}</p>
            {call.member_email && (
              <p className="text-xs text-dashboard-text-muted truncate">{call.member_email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="rounded-lg p-1.5 text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text transition-colors" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded-lg p-1.5 text-dashboard-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={call.status} />
        {call.engagement && <EngagementBadge level={call.engagement} />}
      </div>

      {/* Date + time */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-dashboard-text-muted">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(call.scheduled_date)}
          {call.status === "upcoming" && (
            <span
              className="ml-1 font-semibold"
              style={{ color: days < 0 ? "#ef4444" : days === 0 ? "#f59e0b" : days < 3 ? "#f59e0b" : "#10b981" }}
            >
              {days < 0 ? `(${Math.abs(days)}d overdue)` : days === 0 ? "(Today)" : `(in ${days}d)`}
            </span>
          )}
        </span>
        {call.duration_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {call.duration_minutes} min
          </span>
        )}
      </div>

      {/* Topic */}
      {call.topic && (
        <p className="text-sm text-dashboard-text leading-relaxed">{call.topic}</p>
      )}

      {/* Notes */}
      {call.notes && (
        <p className="text-xs text-dashboard-text-muted leading-relaxed line-clamp-3 border-t border-dashboard-border/50 pt-2">
          {call.notes}
        </p>
      )}

      {/* Follow up */}
      {call.follow_up && (
        <div
          className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span className="text-amber-300">{call.follow_up}</span>
        </div>
      )}

      {/* Quick status change */}
      {call.status === "upcoming" && (
        <div className="flex gap-2 pt-1 border-t border-dashboard-border/50">
          <button
            type="button"
            onClick={() => onStatusChange("completed")}
            className="flex-1 rounded-xl py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
            style={{ border: "1px solid rgba(16,185,129,0.25)" }}
          >
            ✓ Mark Complete
          </button>
          <button
            type="button"
            onClick={() => onStatusChange("missed")}
            className="flex-1 rounded-xl py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
            style={{ border: "1px solid rgba(239,68,68,0.25)" }}
          >
            ✗ Missed
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ calls }: { calls: PrivateCall[] }) {
  const total = calls.length;
  const completed = calls.filter((c) => c.status === "completed").length;
  const upcoming = calls.filter((c) => c.status === "upcoming").length;
  const green = calls.filter((c) => c.engagement === "green").length;
  const yellow = calls.filter((c) => c.engagement === "yellow").length;
  const red = calls.filter((c) => c.engagement === "red").length;

  if (total === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 dashboard-fade-in-delay-1"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="text-center">
          <p className="text-xl font-black text-dashboard-text">{total}</p>
          <p className="text-xs text-dashboard-text-muted">Total</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-blue-400">{upcoming}</p>
          <p className="text-xs text-dashboard-text-muted">Upcoming</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-emerald-400">{completed}</p>
          <p className="text-xs text-dashboard-text-muted">Completed</p>
        </div>
        <div className="text-center col-span-2 sm:col-span-1">
          <div className="flex justify-center gap-1 text-sm mb-0.5">
            <span>🟢{green}</span>
            <span>🟡{yellow}</span>
            <span>🔴{red}</span>
          </div>
          <p className="text-xs text-dashboard-text-muted">Engagement</p>
        </div>
        <div className="text-center hidden sm:block">
          <p className="text-xl font-black text-emerald-400">
            {total > 0 ? Math.round((completed / total) * 100) : 0}%
          </p>
          <p className="text-xs text-dashboard-text-muted">Completion</p>
        </div>
      </div>
      {/* Engagement bar */}
      {(green + yellow + red) > 0 && (
        <div className="mt-3 flex gap-0.5 h-1.5 rounded-full overflow-hidden">
          <div className="rounded-full transition-all" style={{ width: `${(green / total) * 100}%`, background: "#10b981" }} />
          <div className="rounded-full transition-all" style={{ width: `${(yellow / total) * 100}%`, background: "#f59e0b" }} />
          <div className="rounded-full transition-all" style={{ width: `${(red / total) * 100}%`, background: "#ef4444" }} />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PrivateCallsClient() {
  const [calls, setCalls] = useState<PrivateCall[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CallStatus | "all">("all");
  const [filterEngagement, setFilterEngagement] = useState<EngagementLevel | "all">("all");

  // Form state
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fDate, setFDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fDuration, setFDuration] = useState<number | "">(30);
  const [fTopic, setFTopic] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [fStatus, setFStatus] = useState<CallStatus>("upcoming");
  const [fEngagement, setFEngagement] = useState<EngagementLevel>(null);
  const [fFollowUp, setFFollowUp] = useState("");

  useEffect(() => {
    setCalls(loadCalls());
  }, []);

  const persist = useCallback((updated: PrivateCall[]) => {
    setCalls(updated);
    saveCalls(updated);
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFName(""); setFEmail(""); setFDate(new Date().toISOString().slice(0, 10));
    setFDuration(30); setFTopic(""); setFNotes(""); setFStatus("upcoming");
    setFEngagement(null); setFFollowUp("");
    setDialogOpen(true);
  };

  const openEdit = (c: PrivateCall) => {
    setEditingId(c.id);
    setFName(c.member_name); setFEmail(c.member_email ?? "");
    setFDate(c.scheduled_date.slice(0, 10));
    setFDuration(c.duration_minutes ?? "");
    setFTopic(c.topic ?? ""); setFNotes(c.notes ?? "");
    setFStatus(c.status); setFEngagement(c.engagement);
    setFFollowUp(c.follow_up ?? "");
    setDialogOpen(true);
  };

  const saveCall = () => {
    if (!fName.trim()) return;
    if (editingId) {
      persist(calls.map((c) => c.id === editingId ? {
        ...c,
        member_name: fName.trim(),
        member_email: fEmail.trim() || undefined,
        scheduled_date: fDate,
        duration_minutes: fDuration ? Number(fDuration) : undefined,
        topic: fTopic.trim() || undefined,
        notes: fNotes.trim() || undefined,
        status: fStatus,
        engagement: fEngagement,
        follow_up: fFollowUp.trim() || undefined,
      } : c));
    } else {
      const newCall: PrivateCall = {
        id: `call_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        member_name: fName.trim(),
        member_email: fEmail.trim() || undefined,
        scheduled_date: fDate,
        duration_minutes: fDuration ? Number(fDuration) : undefined,
        topic: fTopic.trim() || undefined,
        notes: fNotes.trim() || undefined,
        status: fStatus,
        engagement: fEngagement,
        follow_up: fFollowUp.trim() || undefined,
        created_at: new Date().toISOString(),
      };
      persist([newCall, ...calls]);
    }
    setDialogOpen(false);
  };

  const deleteCall = (id: string) => {
    if (!confirm("Delete this call record?")) return;
    persist(calls.filter((c) => c.id !== id));
  };

  const updateStatus = (id: string, status: CallStatus) => {
    persist(calls.map((c) => c.id === id ? { ...c, status } : c));
  };

  // Filter
  const filtered = calls.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterEngagement !== "all" && c.engagement !== filterEngagement) return false;
    return true;
  }).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 dashboard-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Phone className="h-4 w-4 text-blue-400" />
            </div>
            <h1 className="text-2xl font-black text-dashboard-text tracking-tight">Private Calls</h1>
            {calls.length > 0 && (
              <span className="rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold px-2.5 py-0.5">
                {calls.length}
              </span>
            )}
          </div>
          <p className="text-sm text-dashboard-text-muted">
            Track pastoral calls & one-on-one meetings. Log engagement levels, notes, and follow-ups.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-dashboard-border p-2.5 text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text transition-colors"
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[.98]"
          >
            <Plus className="h-4 w-4" />
            Log Call
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar calls={calls} />

      {/* Filters */}
      {calls.length > 0 && (
        <div className="flex flex-wrap gap-2 dashboard-fade-in-delay-1">
          <div className="flex items-center gap-1.5 text-xs text-dashboard-text-muted">
            <Filter className="h-3.5 w-3.5" />
            Filter:
          </div>
          {/* Status filter */}
          {(["all", "upcoming", "completed", "missed", "rescheduled"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
              style={filterStatus === s ? {
                background: s === "all" ? "rgba(255,255,255,0.1)" : STATUS_CONFIG[s as CallStatus]?.bg ?? "rgba(255,255,255,0.1)",
                color: s === "all" ? "hsl(var(--dashboard-text))" : STATUS_CONFIG[s as CallStatus]?.color ?? "hsl(var(--dashboard-text))",
                border: "1px solid rgba(255,255,255,0.15)",
              } : {
                color: "hsl(var(--dashboard-text-muted))",
                border: "1px solid transparent",
              }}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s as CallStatus].label}
            </button>
          ))}
          <div className="w-px h-5 bg-dashboard-border/50 self-center" />
          {(["green", "yellow", "red"] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setFilterEngagement(filterEngagement === e ? "all" : e)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
              style={filterEngagement === e ? {
                background: ENGAGEMENT_CONFIG[e].bg,
                color: ENGAGEMENT_CONFIG[e].color,
                border: `1px solid ${ENGAGEMENT_CONFIG[e].border}`,
              } : {
                color: "hsl(var(--dashboard-text-muted))",
                border: "1px solid transparent",
              }}
            >
              {ENGAGEMENT_CONFIG[e].emoji} {ENGAGEMENT_CONFIG[e].label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center dashboard-fade-in-delay-2">
          <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <Phone className="h-7 w-7 text-blue-400" />
          </div>
          <p className="text-base font-semibold text-dashboard-text mb-1">No calls logged yet</p>
          <p className="text-sm text-dashboard-text-muted mb-6 max-w-sm">
            Log your pastoral calls and one-on-one meetings to track engagement and follow-ups across your congregation.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="h-4 w-4" />
            Log Your First Call
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-dashboard-text-muted">
          No calls match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 dashboard-fade-in-delay-2">
          {filtered.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              onEdit={() => openEdit(call)}
              onDelete={() => deleteCall(call.id)}
              onStatusChange={(s) => updateStatus(call.id, s)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId
                ? <><Pencil className="h-4 w-4 text-blue-400" /> Edit Call</>
                : <><Sparkles className="h-4 w-4 text-blue-400" /> Log Private Call</>
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Member info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">
                  Member Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Email (optional)</label>
                <input
                  type="email"
                  value={fEmail}
                  onChange={(e) => setFEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Date + duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={fDate}
                  onChange={(e) => setFDate(e.target.value)}
                  className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Duration</label>
                <select
                  value={fDuration}
                  onChange={(e) => setFDuration(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">— select —</option>
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-2 uppercase tracking-wider">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(STATUS_CONFIG) as CallStatus[]).map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFStatus(s)}
                      className="flex items-center gap-2 rounded-xl p-2.5 text-sm transition-all"
                      style={fStatus === s ? {
                        background: cfg.bg,
                        border: `1.5px solid ${cfg.color}40`,
                        color: cfg.color,
                      } : {
                        border: "1.5px solid hsl(var(--dashboard-border))",
                        color: "hsl(var(--dashboard-text-muted))",
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium text-xs">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Engagement level */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-2 uppercase tracking-wider">
                Engagement Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ENGAGEMENT_CONFIG) as NonNullable<EngagementLevel>[]).map((e) => {
                  const cfg = ENGAGEMENT_CONFIG[e];
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setFEngagement(fEngagement === e ? null : e)}
                      className="flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all"
                      style={fEngagement === e ? {
                        background: cfg.bg,
                        border: `1.5px solid ${cfg.border}`,
                        color: cfg.color,
                      } : {
                        border: "1.5px solid hsl(var(--dashboard-border))",
                        color: "hsl(var(--dashboard-text-muted))",
                      }}
                    >
                      <span className="text-lg">{cfg.emoji}</span>
                      <span className="text-xs font-bold">{cfg.label}</span>
                      <span className="text-[10px] opacity-70">{cfg.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Topic / Purpose</label>
              <input
                type="text"
                value={fTopic}
                onChange={(e) => setFTopic(e.target.value)}
                placeholder="e.g. Spiritual check-in, prayer request, counseling"
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Notes (private)</label>
              <textarea
                value={fNotes}
                onChange={(e) => setFNotes(e.target.value)}
                placeholder="What was discussed? Key takeaways…"
                rows={3}
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>

            {/* Follow up */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                Follow-up Action
              </label>
              <input
                type="text"
                value={fFollowUp}
                onChange={(e) => setFFollowUp(e.target.value)}
                placeholder="e.g. Send resources on grief, Follow up in 2 weeks"
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl border border-dashboard-border px-4 py-2.5 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveCall}
              disabled={!fName.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[.98]"
            >
              {editingId ? "Save Changes" : "Log Call"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
