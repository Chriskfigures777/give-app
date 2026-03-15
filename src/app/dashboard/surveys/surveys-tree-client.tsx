"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Video, CalendarDays } from "lucide-react";
import type { SurveyRow } from "./page";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  draft:     { label: "Draft",     color: "bg-slate-500/15 text-slate-400 ring-slate-500/20",       dot: "#94a3b8" },
  published: { label: "Published", color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20", dot: "#34d399" },
  closed:    { label: "Closed",    color: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/20",          dot: "#71717a" },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function relDate(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MonthGroup = {
  key: string;       // "2026-03"
  year: number;
  month: number;     // 0-indexed
  label: string;     // "March 2026"
  surveys: SurveyRow[];
};

function groupByMonth(surveys: SurveyRow[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();

  for (const s of surveys) {
    const d = new Date(s.created_at);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        year,
        month,
        label: `${MONTH_NAMES[month]} ${year}`,
        surveys: [],
      });
    }
    map.get(key)!.surveys.push(s);
  }

  // Sort newest month first
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
}

// ── SurveyCard ────────────────────────────────────────────────────────────────

function SurveyCard({ s }: { s: SurveyRow }) {
  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.draft;
  const qCount = Array.isArray(s.questions) ? s.questions.length : 0;
  const accentColor = s.theme?.accent_color ?? "#10b981";
  const hasVideo = !!(s.theme?.video_url);

  return (
    <Link
      href={`/dashboard/surveys/${s.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm transition-all hover:bg-dashboard-card-hover hover:shadow-md"
    >
      {/* Accent avatar */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
        style={{ backgroundColor: accentColor }}
      >
        {(s.title || "U")[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dashboard-text truncate">
          {s.title || "Untitled survey"}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          <span className="text-xs text-dashboard-text-muted">
            {qCount} question{qCount !== 1 ? "s" : ""}
          </span>
          {s.description && (
            <span className="text-xs text-dashboard-text-muted truncate max-w-[200px]">
              {s.description}
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${cfg.color}`}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
        {hasVideo && (
          <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400 ring-1 ring-violet-500/20">
            <Video className="h-3 w-3" /> Video
          </span>
        )}
      </div>

      {/* Date + arrow */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-dashboard-text-muted">
          {relDate(s.updated_at)}
        </span>
        <span
          className="text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: accentColor }}
        >
          Open &rarr;
        </span>
      </div>
    </Link>
  );
}

// ── MonthAccordion ─────────────────────────────────────────────────────────────

function MonthAccordion({ group, defaultOpen }: { group: MonthGroup; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const publishedCount = group.surveys.filter((s) => s.status === "published").length;

  return (
    <div className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
      {/* Header row — clicking toggles the month */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-dashboard-card-hover transition-colors text-left"
      >
        {/* Calendar icon */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
          <CalendarDays className="h-4 w-4 text-emerald-400" />
        </span>

        {/* Month label */}
        <span className="flex-1 text-sm font-bold text-dashboard-text">
          {group.label}
        </span>

        {/* Count chips */}
        <span className="hidden sm:inline-flex items-center gap-1.5">
          <span className="rounded-full bg-dashboard-card-hover px-2.5 py-0.5 text-xs font-semibold text-dashboard-text-muted">
            {group.surveys.length} survey{group.surveys.length !== 1 ? "s" : ""}
          </span>
          {publishedCount > 0 && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              {publishedCount} published
            </span>
          )}
        </span>

        {/* Chevron */}
        <ChevronRight
          className="h-4 w-4 text-dashboard-text-muted shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Expanded survey list */}
      {open && (
        <div className="border-t border-dashboard-border px-3 pb-3 pt-2 space-y-2">
          {group.surveys.map((s) => (
            <SurveyCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── SurveysTreeView ───────────────────────────────────────────────────────────

export function SurveysTreeView({ surveys }: { surveys: SurveyRow[] }) {
  const groups = groupByMonth(surveys);

  // Default: open only the most-recent month
  return (
    <div className="dashboard-fade-in-delay-2 space-y-3">
      {groups.map((group, idx) => (
        <MonthAccordion key={group.key} group={group} defaultOpen={idx === 0} />
      ))}
    </div>
  );
}
