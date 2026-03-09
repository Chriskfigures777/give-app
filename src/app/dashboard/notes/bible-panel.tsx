"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, ChevronLeft, ChevronRight, BookOpen, Search,
  Plus, Loader2, AlertCircle, ChevronDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type BibleVerse = {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

type BibleApiResponse = {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_name: string;
};

// ── Bible canon ───────────────────────────────────────────────────────────────

const OT = [
  { name: "Genesis", id: "genesis", chapters: 50 },
  { name: "Exodus", id: "exodus", chapters: 40 },
  { name: "Leviticus", id: "leviticus", chapters: 27 },
  { name: "Numbers", id: "numbers", chapters: 36 },
  { name: "Deuteronomy", id: "deuteronomy", chapters: 34 },
  { name: "Joshua", id: "joshua", chapters: 24 },
  { name: "Judges", id: "judges", chapters: 21 },
  { name: "Ruth", id: "ruth", chapters: 4 },
  { name: "1 Samuel", id: "1+samuel", chapters: 31 },
  { name: "2 Samuel", id: "2+samuel", chapters: 24 },
  { name: "1 Kings", id: "1+kings", chapters: 22 },
  { name: "2 Kings", id: "2+kings", chapters: 25 },
  { name: "1 Chronicles", id: "1+chronicles", chapters: 29 },
  { name: "2 Chronicles", id: "2+chronicles", chapters: 36 },
  { name: "Ezra", id: "ezra", chapters: 10 },
  { name: "Nehemiah", id: "nehemiah", chapters: 13 },
  { name: "Esther", id: "esther", chapters: 10 },
  { name: "Job", id: "job", chapters: 42 },
  { name: "Psalms", id: "psalms", chapters: 150 },
  { name: "Proverbs", id: "proverbs", chapters: 31 },
  { name: "Ecclesiastes", id: "ecclesiastes", chapters: 12 },
  { name: "Song of Solomon", id: "song+of+solomon", chapters: 8 },
  { name: "Isaiah", id: "isaiah", chapters: 66 },
  { name: "Jeremiah", id: "jeremiah", chapters: 52 },
  { name: "Lamentations", id: "lamentations", chapters: 5 },
  { name: "Ezekiel", id: "ezekiel", chapters: 48 },
  { name: "Daniel", id: "daniel", chapters: 12 },
  { name: "Hosea", id: "hosea", chapters: 14 },
  { name: "Joel", id: "joel", chapters: 3 },
  { name: "Amos", id: "amos", chapters: 9 },
  { name: "Obadiah", id: "obadiah", chapters: 1 },
  { name: "Jonah", id: "jonah", chapters: 4 },
  { name: "Micah", id: "micah", chapters: 7 },
  { name: "Nahum", id: "nahum", chapters: 3 },
  { name: "Habakkuk", id: "habakkuk", chapters: 3 },
  { name: "Zephaniah", id: "zephaniah", chapters: 3 },
  { name: "Haggai", id: "haggai", chapters: 2 },
  { name: "Zechariah", id: "zechariah", chapters: 14 },
  { name: "Malachi", id: "malachi", chapters: 4 },
];

const NT = [
  { name: "Matthew", id: "matthew", chapters: 28 },
  { name: "Mark", id: "mark", chapters: 16 },
  { name: "Luke", id: "luke", chapters: 24 },
  { name: "John", id: "john", chapters: 21 },
  { name: "Acts", id: "acts", chapters: 28 },
  { name: "Romans", id: "romans", chapters: 16 },
  { name: "1 Corinthians", id: "1+corinthians", chapters: 16 },
  { name: "2 Corinthians", id: "2+corinthians", chapters: 13 },
  { name: "Galatians", id: "galatians", chapters: 6 },
  { name: "Ephesians", id: "ephesians", chapters: 6 },
  { name: "Philippians", id: "philippians", chapters: 4 },
  { name: "Colossians", id: "colossians", chapters: 4 },
  { name: "1 Thessalonians", id: "1+thessalonians", chapters: 5 },
  { name: "2 Thessalonians", id: "2+thessalonians", chapters: 3 },
  { name: "1 Timothy", id: "1+timothy", chapters: 6 },
  { name: "2 Timothy", id: "2+timothy", chapters: 4 },
  { name: "Titus", id: "titus", chapters: 3 },
  { name: "Philemon", id: "philemon", chapters: 1 },
  { name: "Hebrews", id: "hebrews", chapters: 13 },
  { name: "James", id: "james", chapters: 5 },
  { name: "1 Peter", id: "1+peter", chapters: 5 },
  { name: "2 Peter", id: "2+peter", chapters: 3 },
  { name: "1 John", id: "1+john", chapters: 5 },
  { name: "2 John", id: "2+john", chapters: 1 },
  { name: "3 John", id: "3+john", chapters: 1 },
  { name: "Jude", id: "jude", chapters: 1 },
  { name: "Revelation", id: "revelation", chapters: 22 },
];

const ALL_BOOKS = [...OT, ...NT];

const TRANSLATIONS = [
  { id: "kjv", label: "KJV — King James Version" },
  { id: "web", label: "WEB — World English Bible" },
  { id: "asv", label: "ASV — American Standard" },
  { id: "bbe", label: "BBE — Basic English" },
  { id: "darby", label: "Darby" },
  { id: "youngs", label: "Young's Literal" },
  { id: "oeb-us", label: "OEB — Open English" },
];

// Book cover images for Bible header (rotates by testament / book)
const BIBLE_HEADER_IMAGES = [
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&q=80", // open Bible
  "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=900&q=80", // cross
  "https://images.unsplash.com/photo-1548407260-da850faa41e3?w=900&q=80",    // church light
  "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=900&q=80", // forest light
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=900&q=80", // sunrise valley
];

const BOOK_FONT: React.CSSProperties = {
  fontFamily: "var(--font-barlow), Georgia, serif",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseReference(ref: string): { bookId: string; chapter: number; verse?: number } | null {
  const normalized = ref.trim().toLowerCase();
  const match = normalized.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  if (!match) return null;
  const bookPart = match[1].trim();
  const chapter = parseInt(match[2]);
  const verse = match[3] ? parseInt(match[3]) : undefined;
  const book = ALL_BOOKS.find(
    (b) =>
      b.name.toLowerCase() === bookPart ||
      b.id.replace(/\+/g, " ") === bookPart ||
      b.name.toLowerCase().startsWith(bookPart)
  );
  if (!book) return null;
  return { bookId: book.id, chapter, verse };
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  onClose: () => void;
  onInsert: (text: string) => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function BiblePanel({ onClose, onInsert }: Props) {
  const [translation, setTranslation] = useState("kjv");
  const [bookIndex, setBookIndex] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [tab, setTab] = useState<"browse" | "search">("browse");
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [searchRef, setSearchRef] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showTransPicker, setShowTransPicker] = useState(false);
  const verseRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  const book = ALL_BOOKS[bookIndex];
  const headerImg = BIBLE_HEADER_IMAGES[bookIndex % BIBLE_HEADER_IMAGES.length];
  const isNT = bookIndex >= OT.length;
  const accentColor = isNT ? "#f59e0b" : "#10b981"; // gold for NT, emerald for OT

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const fetchChapter = useCallback(async (bookId: string, chap: number, trans: string) => {
    setLoading(true);
    setError(null);
    setSelectedVerse(null);
    setVerses([]);
    try {
      const res = await fetch(
        `https://bible-api.com/${bookId}+${chap}?translation=${trans}`,
        { cache: "force-cache" }
      );
      if (!res.ok) throw new Error("Chapter not found");
      const data: BibleApiResponse = await res.json();
      setVerses(data.verses);
      setReference(data.reference);
    } catch {
      setError("Failed to load. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChapter(book.id, chapter, translation);
  }, [book.id, chapter, translation, fetchChapter]);

  useEffect(() => {
    if (selectedVerse !== null && verseRefs.current[selectedVerse]) {
      verseRefs.current[selectedVerse]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedVerse]);

  const prevChapter = () => {
    if (chapter > 1) setChapter((c) => c - 1);
    else if (bookIndex > 0) { const prev = ALL_BOOKS[bookIndex - 1]; setBookIndex(bookIndex - 1); setChapter(prev.chapters); }
  };

  const nextChapter = () => {
    if (chapter < book.chapters) setChapter((c) => c + 1);
    else if (bookIndex < ALL_BOOKS.length - 1) { setBookIndex(bookIndex + 1); setChapter(1); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseReference(searchInput);
    if (!parsed) { setSearchError('Try "John 3:16" or "Psalm 23"'); return; }
    setSearching(true); setSearchError(null); setSearchResults([]);
    try {
      const url = parsed.verse
        ? `https://bible-api.com/${parsed.bookId}+${parsed.chapter}:${parsed.verse}?translation=${translation}`
        : `https://bible-api.com/${parsed.bookId}+${parsed.chapter}?translation=${translation}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Not found");
      const data: BibleApiResponse = await res.json();
      setSearchResults(data.verses);
      setSearchRef(data.reference);
    } catch {
      setSearchError('Not found. Try "Romans 8:28" or "Psalm 23".');
    } finally {
      setSearching(false);
    }
  };

  const insertVerse = (v: BibleVerse) => {
    const ref = `${v.book_name} ${v.chapter}:${v.verse}`;
    const transLabel = TRANSLATIONS.find((t) => t.id === translation)?.label.split(" — ")[0] ?? translation.toUpperCase();
    onInsert(`${v.text.trim()}\n\n— ${ref} (${transLabel})`);
  };

  const insertSelected = () => {
    if (selectedVerse === null) return;
    const v = verses.find((x) => x.verse === selectedVerse);
    if (v) insertVerse(v);
  };

  return (
    /* Full-screen overlay — same design language as GoalDetailPanel */
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel slides in from right */}
      <div
        className="goal-panel-enter relative ml-auto flex flex-col h-full bg-[hsl(var(--dashboard-card))] shadow-2xl overflow-hidden"
        style={{ width: 420, maxWidth: "95vw", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* ── Hero image header ── */}
        <div className="relative h-44 shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={headerImg} alt="" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, hsl(var(--dashboard-card)) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%)` }}
          />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Testament badge */}
          <div className="absolute top-4 left-4">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
              style={{ background: accentColor + "25", color: accentColor, border: `1px solid ${accentColor}40` }}
            >
              {isNT ? "New Testament" : "Old Testament"}
            </span>
          </div>
          {/* Book + chapter title */}
          <div className="absolute bottom-4 left-4 right-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5" style={BOOK_FONT}>
              {TRANSLATIONS.find((t) => t.id === translation)?.label.split(" — ")[0]}
            </p>
            <h2 className="text-xl font-black text-white leading-tight" style={BOOK_FONT}>
              {loading ? "Loading…" : (reference || `${book.name} ${chapter}`)}
            </h2>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex shrink-0 px-4 pt-4 pb-0 gap-1"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          {(["browse", "search"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors relative"
              style={BOOK_FONT}
            >
              <span style={{ color: tab === t ? accentColor : "hsl(var(--dashboard-text-muted))" }}>
                {t === "browse" ? "📖 Browse" : "🔍 Look Up"}
              </span>
              {tab === t && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ background: accentColor }}
                />
              )}
            </button>
          ))}

          {/* Translation picker */}
          <div className="ml-auto relative flex items-center">
            <button
              onClick={() => setShowTransPicker(!showTransPicker)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {TRANSLATIONS.find((t) => t.id === translation)?.label.split(" — ")[0]}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            {showTransPicker && (
              <div className="absolute top-9 right-0 z-30 rounded-xl border border-dashboard-border bg-dashboard-card shadow-xl p-1.5 min-w-[200px]">
                {TRANSLATIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTranslation(t.id); setShowTransPicker(false); }}
                    className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs text-dashboard-text hover:bg-dashboard-card-hover transition-colors text-left"
                    style={t.id === translation ? { color: accentColor } : {}}
                  >
                    {t.id === translation && <span className="text-[8px]">✓</span>}
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Browse tab ── */}
        {tab === "browse" ? (
          <>
            {/* Navigation selectors */}
            <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex gap-2">
                {/* Book selector */}
                <div className="relative flex-1">
                  <select
                    value={bookIndex}
                    onChange={(e) => { setBookIndex(Number(e.target.value)); setChapter(1); }}
                    className="w-full h-9 rounded-xl border border-dashboard-border bg-dashboard-card-hover px-3 pr-8 text-sm text-dashboard-text focus:outline-none focus:ring-2 cursor-pointer appearance-none"
                    style={BOOK_FONT}
                  >
                    <optgroup label="— Old Testament —" style={{ background: "hsl(var(--dashboard-card))", fontSize: 11 }}>
                      {OT.map((b, i) => (
                        <option key={b.id} value={i} style={{ background: "hsl(var(--dashboard-card))", color: "hsl(var(--dashboard-text))" }}>{b.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="— New Testament —" style={{ background: "hsl(var(--dashboard-card))", fontSize: 11 }}>
                      {NT.map((b, i) => (
                        <option key={b.id} value={OT.length + i} style={{ background: "hsl(var(--dashboard-card))", color: "hsl(var(--dashboard-text))" }}>{b.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dashboard-text-muted" />
                </div>
                {/* Chapter input */}
                <input
                  type="number"
                  min={1}
                  max={book.chapters}
                  value={chapter}
                  onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= book.chapters) setChapter(v); }}
                  className="w-16 h-9 rounded-xl border border-dashboard-border bg-dashboard-card-hover px-2 text-sm text-dashboard-text text-center focus:outline-none focus:ring-2"
                  style={BOOK_FONT}
                  title={`Chapter 1–${book.chapters}`}
                />
              </div>
            </div>

            {/* Verse content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: accentColor }} />
                    <p className="text-xs text-dashboard-text-muted" style={BOOK_FONT}>Loading…</p>
                  </div>
                </div>
              )}
              {error && !loading && (
                <div className="flex items-center gap-2 text-rose-400 text-sm p-6">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}
              {!loading && !error && verses.length > 0 && (
                <div className="px-6 pt-6 pb-4">
                  {/* Large chapter number watermark */}
                  <p
                    className="text-6xl font-black select-none mb-4 leading-none"
                    style={{ color: accentColor, opacity: 0.12, fontFamily: "Georgia, serif" }}
                  >
                    {chapter}
                  </p>
                  {/* Verse text — flowing prose */}
                  <p className="text-[15px] leading-[2] text-dashboard-text" style={BOOK_FONT}>
                    {verses.map((v) => (
                      <span
                        key={v.verse}
                        ref={(el) => { verseRefs.current[v.verse] = el; }}
                        onClick={() => setSelectedVerse(v.verse === selectedVerse ? null : v.verse)}
                        title={`${book.name} ${chapter}:${v.verse} — click to select`}
                        className={[
                          "cursor-pointer rounded-lg transition-all px-0.5",
                          selectedVerse === v.verse
                            ? "ring-1"
                            : "hover:bg-dashboard-card-hover",
                        ].join(" ")}
                        style={selectedVerse === v.verse ? {
                          background: accentColor + "18",
                          boxShadow: `0 0 0 1px ${accentColor}40`,
                        } : {}}
                      >
                        <sup
                          className="select-none"
                          style={{ color: accentColor, opacity: 0.7, fontSize: "0.58em", marginRight: 1, fontWeight: 700 }}
                        >
                          {v.verse}
                        </sup>
                        {v.text.trim()}{" "}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>

            {/* Sticky footer: insert + chapter navigation */}
            <div className="shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              {selectedVerse !== null && (
                <div
                  className="px-4 py-3 flex items-center justify-between gap-3"
                  style={{ background: accentColor + "08", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div>
                    <p className="text-xs font-bold" style={{ color: accentColor, ...BOOK_FONT }}>
                      {book.name} {chapter}:{selectedVerse}
                    </p>
                    <p className="text-[10px] text-dashboard-text-muted" style={BOOK_FONT}>
                      {verses.find((v) => v.verse === selectedVerse)?.text.slice(0, 60)}…
                    </p>
                  </div>
                  <button
                    onClick={insertSelected}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[.97]"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Insert
                  </button>
                </div>
              )}

              {/* Prev / Next chapter */}
              <div className="flex items-stretch">
                <button
                  onClick={prevChapter}
                  disabled={bookIndex === 0 && chapter === 1}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card-hover disabled:opacity-30 transition-colors"
                  style={{ borderRight: "1px solid rgba(255,255,255,0.07)", ...BOOK_FONT }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="truncate max-w-[110px]">
                    {bookIndex === 0 && chapter === 1 ? "Start" :
                      chapter === 1 ? `${ALL_BOOKS[bookIndex - 1]?.name} ${ALL_BOOKS[bookIndex - 1]?.chapters}`
                      : `${book.name} ${chapter - 1}`}
                  </span>
                </button>
                <button
                  onClick={nextChapter}
                  disabled={bookIndex === ALL_BOOKS.length - 1 && chapter === book.chapters}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card-hover disabled:opacity-30 transition-colors"
                  style={BOOK_FONT}
                >
                  <span className="truncate max-w-[110px]">
                    {bookIndex === ALL_BOOKS.length - 1 && chapter === book.chapters ? "End" :
                      chapter === book.chapters ? `${ALL_BOOKS[bookIndex + 1]?.name} 1`
                      : `${book.name} ${chapter + 1}`}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── Look Up tab ── */
          <div className="flex flex-col flex-1 overflow-hidden">
            <form onSubmit={handleSearch} className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dashboard-text-muted" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="John 3:16 or Psalm 23"
                    className="w-full h-10 rounded-xl border border-dashboard-border bg-dashboard-card-hover pl-9 pr-3 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2"
                    style={{ ["--tw-ring-color" as string]: accentColor + "40", ...BOOK_FONT }}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchInput.trim()}
                  className="h-10 rounded-xl px-4 text-sm font-bold text-white disabled:opacity-40 transition-all active:scale-[.97]"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
                </button>
              </div>
              {searchError && <p className="mt-2 text-xs text-rose-400" style={BOOK_FONT}>{searchError}</p>}
            </form>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {searchResults.length > 0 && (
                <>
                  <p
                    className="text-[10px] font-black uppercase tracking-widest mb-4"
                    style={{ color: accentColor, ...BOOK_FONT }}
                  >
                    {searchRef}
                  </p>
                  <p className="text-[15px] leading-[2] text-dashboard-text" style={BOOK_FONT}>
                    {searchResults.map((v) => (
                      <span key={v.verse} className="group/sv relative">
                        <sup
                          className="select-none"
                          style={{ color: accentColor, opacity: 0.7, fontSize: "0.58em", marginRight: 1, fontWeight: 700 }}
                        >
                          {v.verse}
                        </sup>
                        {v.text.trim()}{" "}
                        <button
                          onClick={() => insertVerse(v)}
                          title="Insert into note"
                          className="inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[10px] font-bold text-white transition-all opacity-0 group-hover/sv:opacity-100 mx-0.5 active:scale-[.95]"
                          style={{ background: accentColor + "cc" }}
                        >
                          <Plus className="h-2.5 w-2.5" /> insert
                        </button>
                      </span>
                    ))}
                  </p>
                </>
              )}
              {searchResults.length === 0 && !searching && !searchError && (
                <div className="py-16 text-center">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: accentColor + "15" }}>
                    <BookOpen className="h-7 w-7" style={{ color: accentColor }} />
                  </div>
                  <p className="text-sm font-semibold text-dashboard-text mb-1" style={BOOK_FONT}>Look up any passage</p>
                  <p className="text-xs text-dashboard-text-muted" style={BOOK_FONT}>
                    Try &ldquo;Romans 8:28&rdquo; or &ldquo;Psalm 23&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
