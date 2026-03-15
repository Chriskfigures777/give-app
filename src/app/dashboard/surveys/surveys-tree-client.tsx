"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderOpen,
  Calendar,
  Video,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import type { SurveyRow } from "./page";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  draft:     { label: "Draft",     color: "bg-slate-500/15 text-slate-400 ring-slate-500/20",       dot: "#94a3b8" },
  published: { label: "Published", color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20", dot: "#34d399" },
  closed:    { label: "Closed",    color: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/20",          dot: "#71717a" },
};

function relDate(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Grouping helpers ──────────────────────────────────────────────────────────

type MonthEntry = { month: number; surveys: SurveyRow[] };
type YearFolder = { year: number; months: MonthEntry[] };

function buildTree(surveys: SurveyRow[]): YearFolder[] {
  const yearMap = new Map<number, Map<number, SurveyRow[]>>();

  for (const s of surveys) {
    const d = new Date(s.created_at);
    const yr = d.getFullYear();
    const mo = d.getMonth() + 1; // 1-indexed

    if (!yearMap.has(yr)) yearMap.set(yr, new Map());
    const moMap = yearMap.get(yr)!;
    if (!moMap.has(mo)) moMap.set(mo, []);
    moMap.get(mo)!.push(s);
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => b - a) // newest year first
    .map(([year, moMap]) => ({
      year,
      months: Array.from(moMap.entries())
        .sort(([a], [b]) => b - a) // newest month first
        .map(([month, srvs]) => ({ month, surveys: srvs })),
    }));
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

      {/* Status + video badges */}
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

      {/* Date + open arrow */}
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

// ── Main SurveysTreeView ──────────────────────────────────────────────────────

export function SurveysTreeView({ surveys }: { surveys: SurveyRow[] }) {
  const tree = buildTree(surveys);

  // Default: open the most recent year, select its most recent month
  const [openYear, setOpenYear] = useState<number | null>(tree[0]?.year ?? null);
  const [selectedYear, setSelectedYear] = useState<number | null>(tree[0]?.year ?? null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    tree[0]?.months[0]?.month ?? null
  );

  // Surveys for the currently selected year+month
  const visibleSurveys =
    selectedYear !== null && selectedMonth !== null
      ? (tree
          .find((f) => f.year === selectedYear)
          ?.months.find((m) => m.month === selectedMonth)
          ?.surveys ?? [])
      : [];

  const selectedMonthName =
    selectedMonth !== null ? MONTH_NAMES[selectedMonth - 1] : null;

  return (
    <div className="dashboard-fade-in-delay-2 flex gap-5">

      {/* ── LEFT: Year / Month sidebar ── */}
      <div className="w-52 flex-shrink-0 space-y-1.5">
        <p className="px-1 text-xs font-bold uppercase tracking-widest text-dashboard-text-muted mb-3">
          Year Folders
        </p>

        {tree.map((folder) => {
          const isOpen = folder.year === openYear;
          const totalInYear = folder.months.reduce((s, m) => s + m.surveys.length, 0);

          return (
            <div key={folder.year}>
              {/* Year row */}
              <button
                type="button"
                onClick={() => {
                  const willOpen = !isOpen;
                  setOpenYear(willOpen ? folder.year : null);
                  if (willOpen) {
                    setSelectedYear(folder.year);
                    setSelectedMonth(folder.months[0]?.month ?? null);
                  }
                }}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors",
                  isOpen
                    ? "bg-dashboard-card border border-dashboard-border text-dashboard-text"
                    : "text-dashboard-text-muted hover:bg-dashboard-card hover:text-dashboard-text",
                ].join(" ")}
              >
                <FolderOpen className="h-4 w-4 flex-shrink-0" />
                <span>{folder.year}</span>
                <span className="ml-auto text-xs tabular-nums text-dashboard-text-muted">
                  {totalInYear}
                </span>
                <ChevronRight
                  className="h-3.5 w-3.5 text-dashboard-text-muted flex-shrink-0 transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                />
              </button>

              {/* Month children */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="months"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="ml-3 mt-1 mb-1 space-y-0.5 border-l border-dashboard-border pl-3">
                      {folder.months.map(({ month, surveys: mSurveys }) => {
                        const isActive =
                          selectedYear === folder.year && selectedMonth === month;
                        return (
                          <button
                            key={month}
                            type="button"
                            onClick={() => {
                              setSelectedYear(folder.year);
                              setSelectedMonth(month);
                            }}
                            className={[
                              "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors",
                              isActive
                                ? "bg-dashboard-card-hover text-dashboard-text font-semibold"
                                : "font-medium text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card",
                            ].join(" ")}
                          >
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                            <span>{MONTH_NAMES[month - 1].slice(0, 3)}</span>
                            <span className="ml-auto text-xs tabular-nums text-dashboard-text-muted">
                              {mSurveys.length}
                            </span>
                            {isActive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── RIGHT: Survey list ── */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Breadcrumb */}
        {selectedYear && selectedMonthName && (
          <div className="flex items-center gap-1.5 text-sm text-dashboard-text-muted mb-1">
            <span className="font-semibold text-dashboard-text">{selectedYear}</span>
            <span>/</span>
            <span>{selectedMonthName}</span>
            <span className="ml-1 text-xs tabular-nums">
              ({visibleSurveys.length} survey{visibleSurveys.length !== 1 ? "s" : ""})
            </span>
          </div>
        )}

        {visibleSurveys.length > 0 ? (
          visibleSurveys.map((s) => <SurveyCard key={s.id} s={s} />)
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-dashboard-border bg-dashboard-card/50 py-14 text-center">
            <div className="mb-3 rounded-2xl bg-emerald-500/10 p-3">
              <ClipboardList className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-dashboard-text">No surveys</p>
            <p className="mt-1 text-xs text-dashboard-text-muted">
              {selectedMonthName ? `Nothing in ${selectedMonthName} ${selectedYear}` : "Select a month"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
