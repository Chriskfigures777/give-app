"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderOpen,
  Calendar,
  FileText,
  Search,
  X,
  Sparkles,
  AlignLeft,
  BookOpen,
  ChevronRight,
} from "lucide-react";

export type NoteCard = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function getNoteAccentColor(id: string): string {
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#84cc16", "#ef4444"];
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[sum % colors.length];
}

function relDate(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: diff > 365 ? "numeric" : undefined });
}

// ── Tree-building ─────────────────────────────────────────────────────────────

type MonthEntry = { month: number; notes: NoteCard[] };
type YearFolder = { year: number; months: MonthEntry[] };

function buildTree(notes: NoteCard[]): YearFolder[] {
  const yearMap = new Map<number, Map<number, NoteCard[]>>();

  for (const n of notes) {
    const d = new Date(n.created_at);
    const yr = d.getFullYear();
    const mo = d.getMonth() + 1;
    if (!yearMap.has(yr)) yearMap.set(yr, new Map());
    const moMap = yearMap.get(yr)!;
    if (!moMap.has(mo)) moMap.set(mo, []);
    moMap.get(mo)!.push(n);
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, moMap]) => ({
      year,
      months: Array.from(moMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([month, ns]) => ({ month, notes: ns })),
    }));
}

// ── NoteRow ───────────────────────────────────────────────────────────────────

function NoteRow({ note }: { note: NoteCard }) {
  const accent = getNoteAccentColor(note.id);
  const preview = stripHtml(note.content).slice(0, 120);
  const words = countWords(note.content);

  return (
    <Link
      href={`/dashboard/notes/${note.id}`}
      className="group flex items-start gap-4 rounded-2xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm transition-all hover:bg-dashboard-card-hover hover:shadow-md"
    >
      {/* Color avatar */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold mt-0.5"
        style={{ backgroundColor: accent }}
      >
        {(note.title || "U")[0].toUpperCase()}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dashboard-text truncate">
          {note.title || "Untitled"}
        </p>
        {preview ? (
          <p className="mt-0.5 text-xs text-dashboard-text-muted line-clamp-2 leading-relaxed">
            {preview}{note.content.length > 120 ? "…" : ""}
          </p>
        ) : (
          <p className="mt-0.5 text-xs italic text-dashboard-text-muted/50">No content</p>
        )}
        <div className="mt-1.5 flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-dashboard-text-muted">
            <FileText className="h-3 w-3" />
            {words.toLocaleString()} words
          </span>
          <span className="text-[11px] text-dashboard-text-muted">
            Updated {relDate(note.updated_at)}
          </span>
        </div>
      </div>

      {/* AI Survey quick-action */}
      <span
        className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5"
      >
        <Sparkles className="h-3 w-3" />
        AI Survey
      </span>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function NotesGalleryClient({ notes }: { notes: NoteCard[] }) {
  const tree = buildTree(notes);

  const [openYear, setOpenYear]       = useState<number | null>(tree[0]?.year ?? null);
  const [selectedYear, setSelectedYear] = useState<number | null>(tree[0]?.year ?? null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    tree[0]?.months[0]?.month ?? null
  );
  const [search, setSearch] = useState("");

  // Notes for selected year+month
  const monthNotes = useMemo(() => {
    if (selectedYear === null || selectedMonth === null) return [];
    return (
      tree
        .find((f) => f.year === selectedYear)
        ?.months.find((m) => m.month === selectedMonth)
        ?.notes ?? []
    );
  }, [tree, selectedYear, selectedMonth]);

  // Apply search filter
  const visibleNotes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return monthNotes;
    return monthNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        stripHtml(n.content).toLowerCase().includes(q)
    );
  }, [monthNotes, search]);

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
          const totalInYear = folder.months.reduce((s, m) => s + m.notes.length, 0);

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
                    setSearch("");
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
                      {folder.months.map(({ month, notes: mNotes }) => {
                        const isActive =
                          selectedYear === folder.year && selectedMonth === month;
                        return (
                          <button
                            key={month}
                            type="button"
                            onClick={() => {
                              setSelectedYear(folder.year);
                              setSelectedMonth(month);
                              setSearch("");
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
                              {mNotes.length}
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

      {/* ── RIGHT: Note list ── */}
      <div className="flex-1 min-w-0 space-y-3">

        {/* Breadcrumb + search bar */}
        {selectedYear && selectedMonthName && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-dashboard-text-muted">
              <span className="font-semibold text-dashboard-text">{selectedYear}</span>
              <span>/</span>
              <span>{selectedMonthName}</span>
              <span className="ml-1 text-xs tabular-nums">
                ({monthNotes.length} note{monthNotes.length !== 1 ? "s" : ""})
              </span>
            </div>

            {/* Search within the selected month */}
            <div className="relative flex-1 min-w-[160px] max-w-xs ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 pl-9 pr-8 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dashboard-text-muted hover:text-dashboard-text transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Note cards */}
        {visibleNotes.length > 0 ? (
          visibleNotes.map((n) => <NoteRow key={n.id} note={n} />)
        ) : monthNotes.length > 0 && search ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-dashboard-border bg-dashboard-card/50 py-14 text-center">
            <Search className="h-6 w-6 text-dashboard-text-muted mb-3" />
            <p className="text-sm font-semibold text-dashboard-text">No results</p>
            <p className="mt-1 text-xs text-dashboard-text-muted">
              No notes match &ldquo;{search}&rdquo; in {selectedMonthName} {selectedYear}
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-dashboard-border bg-dashboard-card/50 py-14 text-center">
            <div className="mb-3 rounded-2xl bg-emerald-500/10 p-3">
              <BookOpen className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-dashboard-text">No notes</p>
            <p className="mt-1 text-xs text-dashboard-text-muted">
              {selectedMonthName
                ? `Nothing in ${selectedMonthName} ${selectedYear}`
                : "Select a month to view notes"}
            </p>
          </div>
        )}

        {/* Search result count */}
        {search && visibleNotes.length > 0 && (
          <p className="text-xs text-dashboard-text-muted text-right">
            {visibleNotes.length} of {monthNotes.length} note{monthNotes.length !== 1 ? "s" : ""} shown
            <button onClick={() => setSearch("")} className="ml-2 text-emerald-400 hover:text-emerald-300 transition-colors font-semibold">
              Clear
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
