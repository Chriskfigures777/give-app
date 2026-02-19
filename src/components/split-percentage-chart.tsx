"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Minus, Trash2, Users, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { OrgPlan } from "@/lib/plan";

/* ── Color palette ───────────────────────────────────────────── */
const COLORS = [
  { fill: "#3b82f6", glow: "rgba(59,130,246,0.35)", bg: "#eff6ff" },
  { fill: "#8b5cf6", glow: "rgba(139,92,246,0.35)", bg: "#f5f3ff" },
  { fill: "#f59e0b", glow: "rgba(245,158,11,0.35)", bg: "#fffbeb" },
  { fill: "#ef4444", glow: "rgba(239,68,68,0.35)", bg: "#fef2f2" },
  { fill: "#06b6d4", glow: "rgba(6,182,212,0.35)", bg: "#ecfeff" },
  { fill: "#ec4899", glow: "rgba(236,72,153,0.35)", bg: "#fdf2f8" },
];
const ORG = { fill: "#10b981", glow: "rgba(16,185,129,0.3)", bg: "#ecfdf5" };

type Split = { percentage: number; accountId: string };
type Peer = {
  id: string;
  name: string;
  slug: string;
  stripe_connect_account_id: string;
};

interface Props {
  splits: Split[];
  onSplitsChange: (s: Split[]) => void;
  connectedPeers: Peer[];
  organizationName: string;
  compact?: boolean;
  maxRecipients?: number;
  currentPlan?: OrgPlan;
}

/* ── SVG constants ───────────────────────────────────────────── */
const CX = 100;
const CY = 100;
const R = 70;
const SW = 22;
const VB = 200;
const CIRC = 2 * Math.PI * R;

function toXY(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}

function mouseAngle(e: MouseEvent | TouchEvent, svg: SVGSVGElement) {
  const rect = svg.getBoundingClientRect();
  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
  const sx = VB / rect.width;
  const sy = VB / rect.height;
  const mx = (clientX - rect.left) * sx;
  const my = (clientY - rect.top) * sy;
  let a = (Math.atan2(mx - CX, -(my - CY)) * 180) / Math.PI;
  if (a < 0) a += 360;
  return a;
}

export function SplitPercentageChart({
  splits,
  onSplitsChange,
  connectedPeers,
  organizationName,
  compact,
  maxRecipients = Infinity,
  currentPlan = "free",
}: Props) {
  const atRecipientLimit = maxRecipients !== Infinity && splits.length >= maxRecipients;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  /** When adding: null. When editing row i: i */
  const [recipientModalEditIdx, setRecipientModalEditIdx] = useState<number | null>(null);

  /* ── Derived data ────────────────────────────────────────── */
  const totalSplitPct = splits.reduce((s, e) => s + (e.percentage || 0), 0);
  const orgPct = Math.max(0, 100 - totalSplitPct);

  /*
   * Segment order (clockwise from 12 o'clock):
   *   split0 → split1 → ... → org
   * This keeps handle-drag math simple: dragging handle i only
   * changes split i, and the org segment absorbs the difference.
   */
  const segments = useMemo(() => {
    const s: {
      label: string;
      pct: number;
      color: string;
      glow: string;
      splitIdx: number;
    }[] = [];
    splits.forEach((sp, i) => {
      const peer = connectedPeers.find(
        (p) => p.stripe_connect_account_id === sp.accountId,
      );
      const c = COLORS[i % COLORS.length];
      s.push({
        label: peer?.name || `Split ${i + 1}`,
        pct: sp.percentage || 0,
        color: c.fill,
        glow: c.glow,
        splitIdx: i,
      });
    });
    s.push({
      label: organizationName || "Your Organization",
      pct: orgPct,
      color: ORG.fill,
      glow: ORG.glow,
      splitIdx: -1,
    });
    return s;
  }, [splits, connectedPeers, orgPct, organizationName]);

  const cumPcts = useMemo(() => {
    let c = 0;
    return segments.map((seg) => {
      const start = c;
      c += seg.pct;
      return start;
    });
  }, [segments]);

  /* Handle positions: at the end of each split segment */
  const handles = splits.map((_, i) => {
    const endPct = cumPcts[i] + segments[i].pct;
    return { ...toXY((endPct / 100) * 360), splitIdx: i };
  });

  /* ── Drag logic ──────────────────────────────────────────── */
  const draggingRef = useRef(dragging);
  draggingRef.current = dragging;
  const splitsRef = useRef(splits);
  splitsRef.current = splits;
  const onSplitsChangeRef = useRef(onSplitsChange);
  onSplitsChangeRef.current = onSplitsChange;

  const startDrag = useCallback(
    (i: number) => (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(i);
    },
    [],
  );

  useEffect(() => {
    if (dragging === null) return;

    let rafId: number | null = null;
    let pendingAngle: number | null = null;

    function scheduleUpdate(a: number) {
      pendingAngle = a;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const val = pendingAngle;
          pendingAngle = null;
          if (val === null) return;
          const svg = svgRef.current;
          const idx = draggingRef.current;
          if (!svg || idx === null) return;

          const target = (val / 360) * 100;
          const prev = splitsRef.current
            .slice(0, idx)
            .reduce((s, e) => s + (e.percentage || 0), 0);
          let np = target - prev;
          const others = splitsRef.current.reduce(
            (s, e, j) => (j === idx ? s : s + (e.percentage || 0)),
            0,
          );
          np = Math.max(0, Math.min(100 - others, np));
          const rounded = Math.round(np);

          if (rounded !== splitsRef.current[idx]?.percentage) {
            const next = [...splitsRef.current];
            next[idx] = { ...next[idx], percentage: rounded };
            onSplitsChangeRef.current(next);
          }
        });
      }
    }

    function move(e: MouseEvent | TouchEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      scheduleUpdate(mouseAngle(e, svg));
    }

    function up() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      setDragging(null);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [dragging]);

  /* ── Helpers ─────────────────────────────────────────────── */
  function setPct(i: number, pct: number) {
    const others = splits.reduce(
      (s, e, j) => (j === i ? s : s + (e.percentage || 0)),
      0,
    );
    const next = [...splits];
    next[i] = {
      ...next[i],
      percentage: Math.max(0, Math.min(100 - others, pct)),
    };
    onSplitsChange(next);
  }

  function setAccount(i: number, accountId: string) {
    const next = [...splits];
    next[i] = { ...next[i], accountId };
    onSplitsChange(next);
  }

  const openAddRecipientModal = () => {
    setRecipientModalEditIdx(null);
    setRecipientModalOpen(true);
  };

  const openEditRecipientModal = (idx: number) => {
    setRecipientModalEditIdx(idx);
    setRecipientModalOpen(true);
  };

  const handleSelectRecipient = (accountId: string) => {
    if (recipientModalEditIdx !== null) {
      setAccount(recipientModalEditIdx, accountId);
    } else {
      onSplitsChange([...splits, { percentage: 0, accountId }]);
    }
    setRecipientModalOpen(false);
  };

  /** Peers available to add: exclude those already in splits (except when editing that row) */
  const availablePeers = useMemo(() => {
    const usedIds = new Set(
      splits
        .map((s, i) => (i === recipientModalEditIdx ? null : s.accountId))
        .filter(Boolean) as string[]
    );
    return connectedPeers.filter((p) => !usedIds.has(p.stripe_connect_account_id));
  }, [connectedPeers, splits, recipientModalEditIdx]);

  const size = compact ? 180 : 220;

  return (
    <div className="space-y-5">
      {/* ── Donut chart ────────────────────────────────────── */}
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB} ${VB}`}
          className="w-full h-full select-none"
          style={{ cursor: dragging !== null ? "grabbing" : "default" }}
        >
          {/* Defs: subtle shadow for handles */}
          <defs>
            <filter id="handleShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={SW}
          />

          {/* Segments */}
          {segments.map((seg, i) => {
            if (seg.pct <= 0) return null;
            const dash = (seg.pct / 100) * CIRC;
            const gap = CIRC - dash;
            const offset = -(cumPcts[i] / 100) * CIRC;
            const isH = hovered === i;
            return (
              <circle
                key={i}
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={isH ? SW + 4 : SW}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{
                  transition:
                    dragging !== null
                      ? "none"
                      : "stroke-dasharray 0.4s cubic-bezier(.4,0,.2,1), stroke-dashoffset 0.4s cubic-bezier(.4,0,.2,1), stroke-width 0.15s ease",
                  filter: isH
                    ? `drop-shadow(0 0 8px ${seg.glow})`
                    : "none",
                  pointerEvents: "visibleStroke",
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {/* Handles (one at the end of each split segment) */}
          {handles.map((h, i) => {
            const c = COLORS[i % COLORS.length];
            const active = dragging === i;
            return (
              <g key={`h${i}`}>
                {/* Glow ring (visible when dragging) */}
                <circle
                  cx={h.x}
                  cy={h.y}
                  r={active ? 11 : 7}
                  fill={c.fill}
                  opacity={active ? 0.2 : 0}
                  style={{ transition: "r 0.2s, opacity 0.2s" }}
                />
                {/* Handle dot */}
                <circle
                  cx={h.x}
                  cy={h.y}
                  r={active ? 6.5 : 5}
                  fill="white"
                  stroke={c.fill}
                  strokeWidth={2.5}
                  filter="url(#handleShadow)"
                  style={{
                    cursor: "grab",
                    transition: "r 0.2s",
                  }}
                  onMouseDown={startDrag(i)}
                  onTouchStart={startDrag(i)}
                />
              </g>
            );
          })}

          {/* Center label */}
          <text
            x={CX}
            y={CY - 6}
            textAnchor="middle"
            className="fill-slate-800 dark:fill-slate-100"
            style={{ fontSize: 24, fontWeight: 800 }}
          >
            {orgPct}%
          </text>
          <text
            x={CX}
            y={CY + 12}
            textAnchor="middle"
            className="fill-slate-400 dark:fill-slate-500"
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            YOUR ORG
          </text>
        </svg>
      </div>

      {/* ── Controls ───────────────────────────────────────── */}
      <div className="space-y-2.5">
        {/* Org row (read-only) */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: ORG.fill }}
          />
          <span className="flex-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate">
            {organizationName || "Your Organization"}
          </span>
          <span className="text-sm font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
            {orgPct}%
          </span>
        </div>

        {/* Split rows */}
        {splits.map((sp, i) => {
          const c = COLORS[i % COLORS.length];
          const maxPct =
            100 -
            splits.reduce(
              (s, e, j) => (j === i ? s : s + (e.percentage || 0)),
              0,
            );
          return (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 overflow-hidden"
            >
              {/* Peer selector – opens modal instead of dropdown */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/30">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: c.fill }}
                />
                <button
                  type="button"
                  onClick={() => openEditRecipientModal(i)}
                  className="flex-1 min-w-0 flex items-center gap-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
                >
                  {sp.accountId ? (
                    connectedPeers.find((p) => p.stripe_connect_account_id === sp.accountId)?.name ?? "Unknown"
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">Select recipient...</span>
                  )}
                  <Users className="h-3.5 w-3.5 shrink-0 opacity-60" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSplitsChange(splits.filter((_, j) => j !== i))
                  }
                  className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Percentage bar + slider + stepper */}
              <div className="px-4 py-3 space-y-3">
                {/* Visual percentage bar – smooth animation when not dragging */}
                <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${sp.percentage}%`,
                      background: c.fill,
                      transition:
                        dragging !== null
                          ? "none"
                          : "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </div>

                {/* Range slider – smooth interaction */}
                <input
                  type="range"
                  min={0}
                  max={maxPct}
                  step={1}
                  value={sp.percentage}
                  onChange={(e) => setPct(i, Number(e.target.value))}
                  className="w-full h-2 rounded-full cursor-pointer touch-none"
                  style={{ accentColor: c.fill }}
                  aria-label={`Percentage for ${segments[i]?.label || "split"}`}
                />

                {/* +/- stepper */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-0.5 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPct(i, sp.percentage - 1)}
                      disabled={sp.percentage <= 0}
                      className="h-7 w-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span
                      className="min-w-[3rem] text-center text-sm font-bold tabular-nums"
                      style={{ color: c.fill }}
                    >
                      {sp.percentage}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPct(i, sp.percentage + 1)}
                      disabled={sp.percentage >= maxPct}
                      className="h-7 w-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    of each donation
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add split button – opens modal to select connection */}
        {atRecipientLimit ? (
          <div className="w-full rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-900/10 py-3 px-4 text-center space-y-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Your {currentPlan === "free" ? "Free" : currentPlan === "website" ? "Website" : "Pro"} plan allows {maxRecipients} split recipient{maxRecipients === 1 ? "" : "s"}.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
            >
              Upgrade for more recipients
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={openAddRecipientModal}
            disabled={connectedPeers.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs font-semibold hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add recipient
          </button>
        )}

        {/* Hint when no peers connected */}
        {connectedPeers.length === 0 && splits.length === 0 && (
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
            <a
              href="/dashboard/connections"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Connect with organizations
            </a>{" "}
            to enable payment splits
          </p>
        )}

        {/* Total indicator */}
        {splits.length > 0 && (
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
              totalSplitPct > 100
                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40"
                : totalSplitPct === 100
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                  : "bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40"
            }`}
          >
            <span>Total splits</span>
            <span className="font-bold tabular-nums">
              {totalSplitPct}% of 100%
            </span>
          </div>
        )}
      </div>

      {/* Add/Edit recipient modal */}
      <Dialog open={recipientModalOpen} onOpenChange={setRecipientModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {recipientModalEditIdx !== null ? "Change recipient" : "Add recipient"}
            </DialogTitle>
            <DialogDescription>
              Select a connection to split donations with. Only organizations you&apos;ve connected with appear here.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
            {availablePeers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                No connections available.{" "}
                <a href="/dashboard/connections" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  Connect with organizations
                </a>{" "}
                first.
              </p>
            ) : (
              availablePeers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectRecipient(p.stripe_connect_account_id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 text-left transition-all"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {p.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
