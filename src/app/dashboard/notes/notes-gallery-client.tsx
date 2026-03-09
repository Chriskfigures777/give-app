"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  FileText, Clock, Video, Image as ImageIcon, AlignLeft,
  Search, ChevronUp, ChevronDown, ChevronsUpDown, Filter, X,
} from "lucide-react";

export type NoteCard = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

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

function formatDate(dateStr: string): { short: string; full: string } {
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  const short =
    diffDays === 0 ? "Today"
    : diffDays === 1 ? "Yesterday"
    : diffDays < 7 ? `${diffDays}d ago`
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: diffDays > 365 ? "numeric" : undefined });
  const full = d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return { short, full };
}

type SortKey = "title" | "updated_at" | "created_at" | "words";
type SortDir = "asc" | "desc";
type TypeFilter = "all" | "image" | "video" | "text";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 text-dashboard-text-muted opacity-50" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3 w-3 text-emerald-400" />
    : <ChevronDown className="h-3 w-3 text-emerald-400" />;
}

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "All types",
  image: "Image cover",
  video: "Video cover",
  text: "Text only",
};

export function NotesGalleryClient({ notes }: { notes: NoteCard[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const rows = useMemo(() => {
    const enriched = notes.map(n => ({
      ...n,
      words: countWords(n.content),
      preview: stripHtml(n.content).slice(0, 100),
      noteType: "text" as TypeFilter,
    }));

    const q = search.toLowerCase().trim();
    let filtered = enriched.filter(n => {
      if (typeFilter !== "all" && n.noteType !== typeFilter) return false;
      if (q && !n.title.toLowerCase().includes(q) && !n.preview.toLowerCase().includes(q)) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortKey === "words") { va = a.words; vb = b.words; }
      else if (sortKey === "title") { va = a.title.toLowerCase(); vb = b.title.toLowerCase(); }
      else { va = a[sortKey]; vb = b[sortKey]; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [notes, search, sortKey, sortDir, typeFilter]);

  const colHeader = (label: string, key: SortKey, extraClass = "") => (
    <th
      className={`px-4 py-3 text-left cursor-pointer select-none whitespace-nowrap group ${extraClass}`}
      onClick={() => toggleSort(key)}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider group-hover:text-dashboard-text transition-colors">
        {label}
        <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="dashboard-fade-in-delay-1 rounded-2xl border border-dashboard-border/80 bg-dashboard-card overflow-hidden shadow-sm">
      {/* Toolbar — inside the notes card so header and list feel unified */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-dashboard-border/60">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-dashboard-border/60 bg-dashboard-card-hover/50 pl-9 pr-9 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all"
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

        {/* Type filter pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-dashboard-border/60 bg-dashboard-card-hover/50">
          <Filter className="h-3.5 w-3.5 text-dashboard-text-muted ml-2 mr-1 shrink-0" />
          {(["all", "image", "video", "text"] as TypeFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                typeFilter === t
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-dashboard-text-muted hover:text-dashboard-text",
              ].join(" ")}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Count */}
        <span className="text-xs text-dashboard-text-muted ml-auto shrink-0">
          {rows.length} {rows.length === 1 ? "note" : "notes"}
          {rows.length !== notes.length && <span className="text-dashboard-text-muted"> of {notes.length}</span>}
        </span>
      </div>

      {/* Table — same card, no extra border; header reads as part of notes section */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-dashboard-border/60 bg-dashboard-card-hover/20">
                <th className="w-8 px-4 py-3" />
                {colHeader("Title", "title", "min-w-[200px]")}
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider">Preview</span>
                </th>
                <th className="px-4 py-3 text-left whitespace-nowrap">
                  <span className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider">Type</span>
                </th>
                {colHeader("Words", "words", "text-right")}
                {colHeader("Updated", "updated_at", "whitespace-nowrap")}
                {colHeader("Created", "created_at", "whitespace-nowrap")}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-dashboard-text-muted">
                    No notes match your search or filter.
                  </td>
                </tr>
              )}
              {rows.map((note, idx) => {
                const accent = getNoteAccentColor(note.id);
                const updated = formatDate(note.updated_at);
                const created = formatDate(note.created_at);
                const TypeIcon = note.noteType === "video" ? Video : note.noteType === "image" ? ImageIcon : AlignLeft;
                return (
                  <tr
                    key={note.id}
                    className="group transition-colors border-b border-dashboard-border/40 last:border-b-0"
                  >
                    {/* Color dot */}
                    <td className="px-4 py-3.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: accent, boxShadow: `0 0 6px ${accent}60` }}
                      />
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/notes/${note.id}`}
                        className="text-sm font-semibold text-dashboard-text hover:text-white transition-colors line-clamp-1"
                      >
                        {note.title || "Untitled"}
                      </Link>
                    </td>

                    {/* Preview */}
                    <td className="px-4 py-3.5 max-w-[280px] xl:max-w-sm">
                      <p className="text-xs text-dashboard-text-muted line-clamp-1">
                        {note.preview || <span className="italic opacity-50">No content</span>}
                        {note.content.length > 100 ? "…" : ""}
                      </p>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: accent + "18",
                          color: accent,
                          border: `1px solid ${accent}30`,
                        }}
                      >
                        <TypeIcon className="h-3 w-3" />
                        {note.noteType === "video" ? "Video" : note.noteType === "image" ? "Image" : "Text"}
                      </span>
                    </td>

                    {/* Words */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-dashboard-text-muted">
                        <FileText className="h-3 w-3 shrink-0" />
                        {note.words.toLocaleString()}
                      </span>
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-dashboard-text-muted" title={updated.full}>
                        {updated.short}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-dashboard-text-muted" title={created.full}>
                        {created.short}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>
      {/* Row hover highlight */}
      <style>{`
        tbody tr:hover { background: hsl(var(--dashboard-card-hover) / 0.4); }
      `}</style>
    </div>
  );
}
