"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Flag, Plus, Trash2, Pencil, Target, Calendar,
  CheckCircle2, Circle, X, Printer, Sparkles,
  Lock, Globe2, TrendingUp, Users, ChevronRight,
  Image as ImageIcon, Award, Zap, BarChart3,
  CheckCheck, Clock, Star, FileDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Types ──────────────────────────────────────────────────────────────────

type Milestone = {
  id: string;
  text: string;
  done: boolean;
  done_at?: string | null;
};

type GoalMeta = {
  d?: string;
  img?: string;
  color?: string;
  category?: string;
  milestones?: Milestone[];
  active_threshold?: number;
  active_unit?: string;
};

type OrgGoal = {
  id: string;
  name: string;
  description?: string | null;
  access: string;
  horizon: string;
  end_date?: string | null;
  start_date?: string | null;
  target_value?: number | null;
  target_unit?: string | null;
  owner_user_ids?: string[];
  created_at: string;
  updated_at: string;
};

type GoalUpdate = {
  id: string;
  goal_id: string;
  value_number?: number | null;
  value_text?: string | null;
  note?: string | null;
  recorded_at: string;
  created_at: string;
};

// ─── Metadata helpers ────────────────────────────────────────────────────────

function parseMeta(description?: string | null): GoalMeta {
  if (!description) return {};
  try {
    const p = JSON.parse(description);
    if (p && typeof p === "object" && p.__give_goal_meta) return p as GoalMeta;
  } catch {}
  return { d: description };
}

function encodeMeta(description: string, meta: Partial<GoalMeta>): string {
  return JSON.stringify({ __give_goal_meta: true, d: description, ...meta });
}

// ─── Constants ───────────────────────────────────────────────────────────────

const HORIZONS = [
  {
    id: "90_day",
    label: "90-Day",
    longLabel: "90-Day Goals",
    subtitle: "Short-term focus",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.35)",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
  },
  {
    id: "1_year",
    label: "1-Year",
    longLabel: "One-Year Goals",
    subtitle: "Annual targets",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.35)",
    gradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
  },
  {
    id: "3_year",
    label: "3-Year",
    longLabel: "Three-Year Vision",
    subtitle: "Strategic vision",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
    border: "rgba(139, 92, 246, 0.35)",
    gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
  },
] as const;

type HorizonId = (typeof HORIZONS)[number]["id"];

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&q=80",
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=900&q=80",
  "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=900&q=80",
  "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=900&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&q=80",
  "https://images.unsplash.com/photo-1511497584788-876760111969?w=900&q=80",
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=900&q=80",
  "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=900&q=80",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=900&q=80",
  "https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?w=900&q=80",
];

const ACCENT_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#84cc16",
];

function getDefaultImage(idx: number): string {
  return COVER_IMAGES[idx % COVER_IMAGES.length];
}

function normalizeHorizon(h: string | undefined): HorizonId {
  if (h === "1_year" || h === "3_year") return h;
  return "90_day";
}

function getCurrentValue(updates: GoalUpdate[]): number | null {
  if (!updates.length) return null;
  const sorted = [...updates].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
  const v = sorted[0]?.value_number;
  return v != null ? Number(v) : null;
}

function daysLeft(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Progress Ring SVG ───────────────────────────────────────────────────────

function ProgressRing({
  percent,
  size = 72,
  stroke = 6,
  color = "#10b981",
  bg = "rgba(255,255,255,0.15)",
  animate = true,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  bg?: string;
  animate?: boolean;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={animate ? { transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.3s" } : {}}
      />
    </svg>
  );
}

// ─── Confetti Burst ───────────────────────────────────────────────────────────

function ConfettiBurst({ active, onDone }: { active: boolean; onDone: () => void }) {
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [active, onDone]);
  if (!active) return null;
  const particles = Array.from({ length: 28 }, (_, i) => ({
    key: i,
    x: 20 + Math.random() * 60,
    y: 10 + Math.random() * 60,
    color: ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#06b6d4"][i % 7],
    size: 5 + Math.random() * 8,
    delay: Math.random() * 0.5,
    duration: 0.9 + Math.random() * 0.6,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.key}
          className="absolute rounded-sm animate-confetti"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Horizon Badge ────────────────────────────────────────────────────────────

function HorizonBadge({ horizon }: { horizon: string }) {
  const h = HORIZONS.find((x) => x.id === normalizeHorizon(horizon));
  if (!h) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: h.bg, color: h.color, border: `1px solid ${h.border}` }}
    >
      {h.label}
    </span>
  );
}

// ─── Goal Card ───────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  index,
  updates,
  onClick,
}: {
  goal: OrgGoal;
  index: number;
  updates: GoalUpdate[];
  onClick: () => void;
}) {
  const meta = parseMeta(goal.description);
  const imgSrc = meta.img || getDefaultImage(index);
  const accentColor = meta.color || HORIZONS.find((h) => h.id === normalizeHorizon(goal.horizon))?.color || "#10b981";
  const current = getCurrentValue(updates);
  const target = goal.target_value != null ? Number(goal.target_value) : null;
  const percent = target != null && target > 0 && current != null ? Math.min(100, (current / target) * 100) : 0;
  const milestones = meta.milestones ?? [];
  const doneMilestones = milestones.filter((m) => m.done).length;
  const days = daysLeft(goal.end_date);
  const isComplete = percent >= 100;

  return (
    <button
      type="button"
      onClick={onClick}
      className="goal-card goal-card-enter relative flex flex-col rounded-2xl overflow-hidden text-left w-full cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      style={{ border: `1.5px solid ${isComplete ? accentColor + "55" : "rgba(255,255,255,0.07)"}` }}
    >
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt=""
          className="goal-card-img w-full h-full object-cover"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.08) 100%)`
        }} />
        {/* Horizon badge top-left */}
        <div className="absolute top-3 left-3">
          <HorizonBadge horizon={goal.horizon} />
        </div>
        {/* Access indicator top-right */}
        <div className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition-opacity">
          {goal.access === "private"
            ? <Lock className="h-3.5 w-3.5 text-white" />
            : <Globe2 className="h-3.5 w-3.5 text-white" />
          }
        </div>
        {/* Complete badge */}
        {isComplete && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="animate-celebrate rounded-2xl px-4 py-2 flex items-center gap-2 backdrop-blur-sm"
              style={{ background: accentColor + "25", border: `1px solid ${accentColor}55` }}
            >
              <Award className="h-5 w-5" style={{ color: accentColor }} />
              <span className="text-sm font-bold text-white">Complete!</span>
            </div>
          </div>
        )}
        {/* Progress ring bottom-right of image */}
        {target != null && (
          <div className="absolute bottom-3 right-3 relative">
            <ProgressRing percent={percent} size={52} stroke={5} color={accentColor} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{Math.round(percent)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="flex flex-col flex-1 p-4 gap-2"
        style={{ background: "hsl(var(--dashboard-card))" }}
      >
        <h3 className="text-sm font-semibold text-dashboard-text leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {goal.name}
        </h3>
        {meta.d && (
          <p className="text-xs text-dashboard-text-muted line-clamp-2 leading-relaxed">{meta.d}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-auto pt-1">
          {target != null && (
            <div className="flex items-center gap-1 text-xs text-dashboard-text-muted">
              <Target className="h-3 w-3" />
              <span>
                {current != null ? current.toLocaleString() : "0"}/{target.toLocaleString()}
                {goal.target_unit ? ` ${goal.target_unit}` : ""}
              </span>
            </div>
          )}
          {milestones.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-dashboard-text-muted">
              <CheckCheck className="h-3 w-3" />
              <span>{doneMilestones}/{milestones.length}</span>
            </div>
          )}
          {days !== null && (
            <div
              className="flex items-center gap-1 text-xs ml-auto"
              style={{ color: days < 7 ? "#ef4444" : days < 30 ? "#f59e0b" : "#6b7280" }}
            >
              <Clock className="h-3 w-3" />
              <span>{days > 0 ? `${days}d left` : "Overdue"}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {target != null && target > 0 && (
          <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${percent}%`, background: accentColor }}
            />
          </div>
        )}
      </div>

      {/* Hover shimmer edge */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1.5px ${accentColor}50` }}
      />
    </button>
  );
}

// ─── Goal Detail Panel ───────────────────────────────────────────────────────

function GoalDetailPanel({
  goal,
  updates,
  onClose,
  onEdit,
  onDelete,
  onUpdateAdded,
  onMilestonesChange,
}: {
  goal: OrgGoal;
  updates: GoalUpdate[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateAdded: (u: GoalUpdate) => void;
  onMilestonesChange: (ms: Milestone[]) => void;
}) {
  const meta = parseMeta(goal.description);
  const accentColor = meta.color || HORIZONS.find((h) => h.id === normalizeHorizon(goal.horizon))?.color || "#10b981";
  const imgSrc = meta.img || getDefaultImage(0);
  const current = getCurrentValue(updates);
  const target = goal.target_value != null ? Number(goal.target_value) : null;
  const percent = target != null && target > 0 && current != null ? Math.min(100, (current / target) * 100) : 0;
  const milestones = meta.milestones ?? [];

  const [updateValue, setUpdateValue] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [updateDate, setUpdateDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>(milestones);
  const [newMilestone, setNewMilestone] = useState("");
  const [justChecked, setJustChecked] = useState<string | null>(null);
  const [savingMilestones, setSavingMilestones] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync milestones from parent
  useEffect(() => {
    setLocalMilestones(meta.milestones ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.description]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const saveProgress = async () => {
    const valueNum = updateValue.trim() ? Number(updateValue) : null;
    if (valueNum === null && !updateNote.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/org-goals/${goal.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value_number: valueNum,
          value_text: updateValue.trim() || null,
          note: updateNote.trim() || null,
          recorded_at: updateDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onUpdateAdded(data);
      setUpdateValue("");
      setUpdateNote("");
      setUpdateDate(new Date().toISOString().slice(0, 10));
      // celebrate if just hit 100%
      if (valueNum !== null && target !== null && valueNum >= target) {
        setConfetti(true);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleMilestone = async (ms: Milestone) => {
    const updated = localMilestones.map((m) =>
      m.id === ms.id
        ? { ...m, done: !m.done, done_at: !m.done ? new Date().toISOString() : null }
        : m
    );
    setLocalMilestones(updated);
    if (!ms.done) setJustChecked(ms.id);
    setTimeout(() => setJustChecked(null), 800);
    await persistMilestones(updated);
  };

  const addMilestone = async () => {
    if (!newMilestone.trim()) return;
    const m: Milestone = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      text: newMilestone.trim(),
      done: false,
    };
    const updated = [...localMilestones, m];
    setLocalMilestones(updated);
    setNewMilestone("");
    await persistMilestones(updated);
  };

  const removeMilestone = async (id: string) => {
    const updated = localMilestones.filter((m) => m.id !== id);
    setLocalMilestones(updated);
    await persistMilestones(updated);
  };

  const persistMilestones = async (ms: Milestone[]) => {
    setSavingMilestones(true);
    try {
      const newMeta: GoalMeta = { ...meta, milestones: ms };
      const encoded = encodeMeta(meta.d ?? "", newMeta);
      await fetch(`/api/org-goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: encoded }),
      });
      onMilestonesChange(ms);
    } catch {}
    setSavingMilestones(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const doneCount = localMilestones.filter((m) => m.done).length;
  const days = daysLeft(goal.end_date);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className="goal-panel-enter relative ml-auto flex flex-col w-full max-w-2xl h-full bg-[hsl(var(--dashboard-card))] shadow-2xl overflow-y-auto goals-print-page"
        style={{ borderLeft: `1px solid rgba(255,255,255,0.08)` }}
      >
        {/* Confetti */}
        <ConfettiBurst active={confetti} onDone={() => setConfetti(false)} />

        {/* Hero image */}
        <div className="relative h-52 shrink-0 overflow-hidden goals-print-hide">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{
            background: `linear-gradient(to top, hsl(var(--dashboard-card)) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.1) 100%)`
          }} />
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2 goals-print-hide">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-colors"
              title="Print / Export"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-colors"
              title="Edit goal"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-red-900/60 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Horizon badge */}
          <div className="absolute bottom-4 left-4">
            <HorizonBadge horizon={goal.horizon} />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6 p-6">

          {/* Title + description */}
          <div>
            <h2 className="text-xl font-bold text-dashboard-text leading-snug">{goal.name}</h2>
            {meta.d && (
              <p className="mt-1.5 text-sm text-dashboard-text-muted leading-relaxed">{meta.d}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-dashboard-text-muted">
              {goal.end_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(goal.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  {days !== null && (
                    <span
                      className="ml-1 font-medium"
                      style={{ color: days < 7 ? "#ef4444" : days < 30 ? "#f59e0b" : accentColor }}
                    >
                      ({days > 0 ? `${days} days left` : "Overdue"})
                    </span>
                  )}
                </span>
              )}
              <span className="flex items-center gap-1">
                {goal.access === "private"
                  ? <><Lock className="h-3.5 w-3.5" />Private</>
                  : <><Globe2 className="h-3.5 w-3.5" />Workspace</>
                }
              </span>
            </div>
          </div>

          {/* Progress ring + stats */}
          {target != null && target > 0 && (
            <div
              className="rounded-2xl p-4 flex items-center gap-5"
              style={{ background: accentColor + "10", border: `1px solid ${accentColor}25` }}
            >
              <div className="relative shrink-0">
                <ProgressRing percent={percent} size={84} stroke={7} color={accentColor} bg="rgba(255,255,255,0.1)" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-dashboard-text">{Math.round(percent)}%</span>
                </div>
                {percent >= 100 && (
                  <div className="absolute -inset-1 rounded-full pulse-complete opacity-60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-dashboard-text-muted mb-1">Progress</p>
                <p className="text-2xl font-black text-dashboard-text leading-none">
                  {current != null ? current.toLocaleString() : "0"}
                  <span className="text-sm font-medium text-dashboard-text-muted ml-1.5">
                    of {target.toLocaleString()} {goal.target_unit ?? ""}
                  </span>
                </p>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-dashboard-text flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: accentColor }} />
                Milestones
                {localMilestones.length > 0 && (
                  <span
                    className="text-[10px] rounded-full px-2 py-0.5 font-semibold"
                    style={{ background: accentColor + "20", color: accentColor }}
                  >
                    {doneCount}/{localMilestones.length}
                  </span>
                )}
              </h3>
              {savingMilestones && (
                <span className="text-xs text-dashboard-text-muted animate-pulse">Saving…</span>
              )}
            </div>

            <ul className="space-y-2">
              {localMilestones.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start gap-3 group/ms rounded-xl p-2.5 transition-colors"
                  style={{ background: m.done ? accentColor + "0d" : "transparent" }}
                >
                  <button
                    type="button"
                    onClick={() => toggleMilestone(m)}
                    className={`shrink-0 mt-0.5 ${justChecked === m.id ? "animate-milestone-check" : ""}`}
                  >
                    {m.done
                      ? <CheckCircle2 className="h-5 w-5" style={{ color: accentColor }} />
                      : <Circle className="h-5 w-5 text-dashboard-text-muted hover:text-dashboard-text transition-colors" />
                    }
                  </button>
                  <span
                    className="text-sm flex-1 leading-relaxed"
                    style={{
                      color: m.done ? "hsl(var(--dashboard-text-muted))" : "hsl(var(--dashboard-text))",
                      textDecoration: m.done ? "line-through" : "none",
                    }}
                  >
                    {m.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMilestone(m.id)}
                    className="shrink-0 opacity-0 group-hover/ms:opacity-100 transition-opacity text-dashboard-text-muted hover:text-red-400 goals-print-hide"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Add milestone */}
            <div className="flex gap-2 mt-3 goals-print-hide">
              <input
                type="text"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMilestone()}
                placeholder="Add milestone…"
                className="flex-1 rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="button"
                onClick={addMilestone}
                disabled={!newMilestone.trim()}
                className="rounded-xl px-3 py-2 text-sm font-medium text-white disabled:opacity-40 transition-colors"
                style={{ background: accentColor }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Log progress */}
          <div className="goals-print-hide">
            <h3 className="text-sm font-semibold text-dashboard-text flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4" style={{ color: accentColor }} />
              Log Progress
            </h3>
            <div className="rounded-2xl border border-dashboard-border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  placeholder={target != null ? `Current total (${goal.target_unit ?? "units"})` : "Value"}
                  className="rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <input
                  type="date"
                  value={updateDate}
                  onChange={(e) => setUpdateDate(e.target.value)}
                  className="rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <input
                type="text"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="button"
                onClick={saveProgress}
                disabled={saving || (!updateValue.trim() && !updateNote.trim())}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90 active:scale-[.98]"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}
              >
                {saving ? "Saving…" : "Save Progress"}
              </button>
            </div>
          </div>

          {/* Update history */}
          {updates.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-dashboard-text flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4" style={{ color: accentColor }} />
                History
              </h3>
              <ul className="space-y-2 max-h-52 overflow-y-auto goals-print-hide">
                {updates.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between text-sm rounded-xl p-2.5 border border-dashboard-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: accentColor }}
                      />
                      <span className="text-dashboard-text">
                        {u.value_number != null && (
                          <strong className="font-semibold">{u.value_number.toLocaleString()} {goal.target_unit ?? ""}</strong>
                        )}
                        {u.note && (
                          <span className="text-dashboard-text-muted ml-1">— {u.note}</span>
                        )}
                      </span>
                    </div>
                    <span className="text-xs text-dashboard-text-muted shrink-0 ml-2">
                      {new Date(u.recorded_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
              {/* Print-only history */}
              <ul className="space-y-1 hidden print:block">
                {updates.map((u) => (
                  <li key={u.id} className="text-sm py-1 border-b border-gray-200">
                    <strong>{new Date(u.recorded_at).toLocaleDateString()}</strong>
                    {u.value_number != null && ` — ${u.value_number.toLocaleString()} ${goal.target_unit ?? ""}`}
                    {u.note && ` — ${u.note}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ horizon, onAdd }: { horizon: HorizonId | "all"; onAdd: () => void }) {
  const h = HORIZONS.find((x) => x.id === horizon);
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: h?.bg ?? "rgba(16,185,129,0.1)", border: `1px solid ${h?.border ?? "rgba(16,185,129,0.2)"}` }}
      >
        <Flag className="h-7 w-7" style={{ color: h?.color ?? "#10b981" }} />
      </div>
      <p className="text-base font-semibold text-dashboard-text mb-1">No goals yet</p>
      <p className="text-sm text-dashboard-text-muted mb-4 max-w-xs">
        Add your first goal to start tracking progress and building momentum.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[.98]"
        style={{ background: h?.gradient ?? "linear-gradient(135deg,#10b981,#059669)" }}
      >
        <Plus className="h-4 w-4" />
        Create first goal
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrgGoalsClient() {
  const router = useRouter();

  // Data
  const [goals, setGoals] = useState<OrgGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatesByGoal, setUpdatesByGoal] = useState<Record<string, GoalUpdate[]>>({});

  // UI state
  const [activeHorizon, setActiveHorizon] = useState<HorizonId | "all">("all");
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);

  // Form state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAccess, setFormAccess] = useState<"workspace" | "private">("workspace");
  const [formHorizon, setFormHorizon] = useState<HorizonId>("90_day");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formImg, setFormImg] = useState("");
  const [formColor, setFormColor] = useState(ACCENT_COLORS[0]);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/org-goals");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to load goals");
      }
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (e) {
      setGoals([]);
      setError(e instanceof Error ? e.message : "Failed to load goals");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGoals().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchGoals]);

  // Fetch updates for visible goals
  useEffect(() => {
    const filtered = getFilteredGoals();
    filtered.forEach((g) => {
      if (updatesByGoal[g.id] !== undefined) return;
      fetch(`/api/org-goals/${g.id}/updates`)
        .then((r) => r.json())
        .then((data) => setUpdatesByGoal((prev) => ({
          ...prev,
          [g.id]: Array.isArray(data) ? data : [],
        })))
        .catch(() => setUpdatesByGoal((prev) => ({ ...prev, [g.id]: [] })));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, activeHorizon]);

  // Fetch updates for open detail
  useEffect(() => {
    if (!detailGoalId) return;
    if (updatesByGoal[detailGoalId] !== undefined) return;
    fetch(`/api/org-goals/${detailGoalId}/updates`)
      .then((r) => r.json())
      .then((data) => setUpdatesByGoal((prev) => ({
        ...prev,
        [detailGoalId]: Array.isArray(data) ? data : [],
      })))
      .catch(() => setUpdatesByGoal((prev) => ({ ...prev, [detailGoalId]: [] })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailGoalId]);

  function getFilteredGoals() {
    if (activeHorizon === "all") return goals;
    return goals.filter((g) => normalizeHorizon(g.horizon) === activeHorizon);
  }

  // Open create form
  const openCreate = (horizon: HorizonId = "90_day") => {
    setEditingGoalId(null);
    setFormHorizon(horizon);
    setFormName(""); setFormDesc(""); setFormAccess("workspace");
    setFormEndDate(""); setFormStartDate(""); setFormTarget(""); setFormUnit("");
    setFormImg(""); setFormColor(ACCENT_COLORS[0]);
    setFormError(null);
    setGoalDialogOpen(true);
  };

  const openEdit = (g: OrgGoal) => {
    const meta = parseMeta(g.description);
    setEditingGoalId(g.id);
    setFormName(g.name);
    setFormDesc(meta.d ?? "");
    setFormAccess((g.access as "workspace" | "private") || "workspace");
    setFormHorizon(normalizeHorizon(g.horizon));
    setFormEndDate(g.end_date ? g.end_date.slice(0, 10) : "");
    setFormStartDate(g.start_date ? g.start_date.slice(0, 10) : "");
    setFormTarget(g.target_value != null ? String(g.target_value) : "");
    setFormUnit(g.target_unit ?? "");
    setFormImg(meta.img ?? "");
    setFormColor(meta.color ?? ACCENT_COLORS[0]);
    setFormError(null);
    setGoalDialogOpen(true);
  };

  const saveGoal = async () => {
    if (!formName.trim()) { setFormError("Goal name is required"); return; }
    setFormSaving(true); setFormError(null);
    try {
      // Preserve existing milestones if editing
      let existingMeta: GoalMeta = {};
      if (editingGoalId) {
        const existing = goals.find((g) => g.id === editingGoalId);
        if (existing) existingMeta = parseMeta(existing.description);
      }
      const meta: GoalMeta = {
        ...existingMeta,
        img: formImg.trim() || undefined,
        color: formColor,
      };
      const encoded = encodeMeta(formDesc.trim(), meta);
      const url = editingGoalId ? `/api/org-goals/${editingGoalId}` : "/api/org-goals";
      const method = editingGoalId ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        name: formName.trim(),
        description: encoded,
        access: formAccess,
        horizon: formHorizon,
        start_date: formStartDate || null,
        end_date: formEndDate || null,
        target_value: formTarget ? Number(formTarget) : null,
        target_unit: formUnit.trim() || null,
      };
      if (!editingGoalId) body.owner_user_ids = [];
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      router.refresh();
      await fetchGoals();
      setGoalDialogOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setFormSaving(false);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm("Delete this goal and all its progress?")) return;
    try {
      const res = await fetch(`/api/org-goals/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "Failed"); }
      router.refresh();
      await fetchGoals();
      if (detailGoalId === id) setDetailGoalId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const filteredGoals = getFilteredGoals();
  const detailGoal = detailGoalId ? goals.find((g) => g.id === detailGoalId) ?? null : null;

  const handleExportDocx = async () => {
    setExportingDocx(true);
    try {
      const res = await fetch("/api/org-goals/export/docx");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Export failed");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match?.[1] ?? "goals-and-priorities.docx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to export");
    } finally {
      setExportingDocx(false);
    }
  };

  const tabs: { id: HorizonId | "all"; label: string }[] = [
    { id: "all", label: "All Goals" },
    ...HORIZONS.map((h) => ({ id: h.id as HorizonId | "all", label: h.longLabel })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-dashboard-text-muted">Loading goals…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header + Add button */}
      <div className="flex items-start justify-between gap-4 dashboard-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Flag className="h-4 w-4 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black text-dashboard-text tracking-tight">Goals</h1>
            {goals.length > 0 && (
              <span className="rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold px-2.5 py-0.5">
                {goals.length}
              </span>
            )}
          </div>
          <p className="text-sm text-dashboard-text-muted">
            Set 90-day, one-year, and three-year goals. Track milestones, log progress, and build momentum.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportDocx}
            disabled={exportingDocx}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-colors disabled:opacity-50"
            title="Export goals and priorities to share with members and community"
          >
            <FileDown className="h-4 w-4" />
            {exportingDocx ? "Exporting…" : "Export"}
          </button>
          <button
            type="button"
            onClick={() => openCreate(activeHorizon === "all" ? "90_day" : activeHorizon)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[.98]"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">{error}</p>
      )}

      {/* Horizon Filter Tabs */}
      <div className="dashboard-fade-in-delay-1">
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {tabs.map((tab) => {
            const h = HORIZONS.find((x) => x.id === tab.id);
            const isActive = activeHorizon === tab.id;
            const count = tab.id === "all"
              ? goals.length
              : goals.filter((g) => normalizeHorizon(g.horizon) === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveHorizon(tab.id)}
                className="shrink-0 relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
                style={isActive ? {
                  background: h ? h.bg : "rgba(16,185,129,0.12)",
                  color: h ? h.color : "#10b981",
                  border: `1px solid ${h ? h.border : "rgba(16,185,129,0.3)"}`,
                } : {
                  color: "hsl(var(--dashboard-text-muted))",
                  border: "1px solid transparent",
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className="rounded-full text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center"
                    style={{
                      background: isActive ? (h?.color ?? "#10b981") + "20" : "rgba(255,255,255,0.07)",
                      color: isActive ? (h?.color ?? "#10b981") : "hsl(var(--dashboard-text-muted))",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 dashboard-fade-in-delay-2">
        {filteredGoals.length === 0 ? (
          <EmptyState
            horizon={activeHorizon}
            onAdd={() => openCreate(activeHorizon === "all" ? "90_day" : activeHorizon)}
          />
        ) : (
          filteredGoals.map((goal, idx) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={idx}
              updates={updatesByGoal[goal.id] ?? []}
              onClick={() => {
                setDetailGoalId(goal.id);
              }}
            />
          ))
        )}
      </div>

      {/* Add per-horizon CTA when filter is active and has goals */}
      {activeHorizon !== "all" && filteredGoals.length > 0 && (
        <div className="flex justify-center goals-print-hide">
          <button
            type="button"
            onClick={() => openCreate(activeHorizon)}
            className="inline-flex items-center gap-2 rounded-xl border border-dashboard-border px-4 py-2 text-sm text-dashboard-text-muted hover:text-dashboard-text hover:border-dashboard-border transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add another {HORIZONS.find((h) => h.id === activeHorizon)?.label ?? ""} goal
          </button>
        </div>
      )}

      {/* Goal Detail Panel */}
      {detailGoal && (
        <GoalDetailPanel
          goal={detailGoal}
          updates={updatesByGoal[detailGoal.id] ?? []}
          onClose={() => setDetailGoalId(null)}
          onEdit={() => {
            setDetailGoalId(null);
            openEdit(detailGoal);
          }}
          onDelete={() => {
            setDetailGoalId(null);
            deleteGoal(detailGoal.id);
          }}
          onUpdateAdded={(u) => {
            setUpdatesByGoal((prev) => ({
              ...prev,
              [detailGoal.id]: [u, ...(prev[detailGoal.id] ?? [])],
            }));
          }}
          onMilestonesChange={(ms) => {
            // Patch the goal in state with new milestones encoded in description
            setGoals((prev) =>
              prev.map((g) => {
                if (g.id !== detailGoal.id) return g;
                const meta = parseMeta(g.description);
                const newDesc = encodeMeta(meta.d ?? "", { ...meta, milestones: ms });
                return { ...g, description: newDesc };
              })
            );
          }}
        />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingGoalId ? (
                <><Pencil className="h-4 w-4 text-emerald-400" /> Edit Goal</>
              ) : (
                <><Sparkles className="h-4 w-4 text-emerald-400" /> Create Goal</>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Horizon selector */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-2 uppercase tracking-wider">Timeframe</label>
              <div className="grid grid-cols-3 gap-2">
                {HORIZONS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setFormHorizon(h.id)}
                    className="rounded-xl p-3 text-left transition-all"
                    style={formHorizon === h.id ? {
                      background: h.bg,
                      border: `1.5px solid ${h.border}`,
                      color: h.color,
                    } : {
                      background: "transparent",
                      border: "1.5px solid hsl(var(--dashboard-border))",
                      color: "hsl(var(--dashboard-text-muted))",
                    }}
                  >
                    <div className="text-sm font-bold">{h.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{h.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">
                Goal Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Reach 500 active members"
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="What does success look like? e.g. Active = 4+ surveys/month"
                rows={2}
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
              />
            </div>

            {/* Target */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Target</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Unit</label>
                <input
                  type="text"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="members, souls, dollars"
                  className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            {/* Cover image */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Cover Image URL
              </label>
              <input
                type="url"
                value={formImg}
                onChange={(e) => setFormImg(e.target.value)}
                placeholder="https://images.unsplash.com/photo-…"
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              {/* Quick presets */}
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {COVER_IMAGES.slice(0, 6).map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormImg(img)}
                    className="shrink-0 h-10 w-16 rounded-lg overflow-hidden border-2 transition-all"
                    style={{ borderColor: formImg === img ? "#10b981" : "transparent" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" />
                Accent Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className="h-7 w-7 rounded-full border-2 transition-all"
                    style={{
                      background: c,
                      borderColor: formColor === c ? "white" : "transparent",
                      boxShadow: formColor === c ? `0 0 0 2px ${c}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Access */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                {(["workspace", "private"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFormAccess(v)}
                    className="flex items-center gap-2 rounded-xl p-3 text-sm transition-all"
                    style={formAccess === v ? {
                      background: "rgba(16,185,129,0.12)",
                      border: "1.5px solid rgba(16,185,129,0.35)",
                      color: "#10b981",
                    } : {
                      border: "1.5px solid hsl(var(--dashboard-border))",
                      color: "hsl(var(--dashboard-text-muted))",
                    }}
                  >
                    {v === "private" ? <Lock className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}
                    <span className="font-medium capitalize">{v}</span>
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-400 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">{formError}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => setGoalDialogOpen(false)}
              className="rounded-xl border border-dashboard-border px-4 py-2.5 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveGoal}
              disabled={formSaving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[.98]"
            >
              {formSaving ? "Saving…" : editingGoalId ? "Save Changes" : "Create Goal"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
