"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, ChevronLeft, ChevronRight, BookOpen, Search, Plus, Loader2, AlertCircle,
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
  { id: "kjv", label: "KJV" },
  { id: "web", label: "WEB" },
  { id: "asv", label: "ASV" },
  { id: "bbe", label: "BBE" },
  { id: "darby", label: "Darby" },
  { id: "youngs", label: "Young's" },
  { id: "oeb-us", label: "OEB" },
];

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

// ── Shared styles ─────────────────────────────────────────────────────────────

const BOOK_FONT: React.CSSProperties = {
  fontFamily: "var(--font-barlow), sans-serif",
};

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  onClose: () => void;
  onInsert: (text: string) => void;
};

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
  const verseRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  const book = ALL_BOOKS[bookIndex];

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
    if (chapter > 1) {
      setChapter((c) => c - 1);
    } else if (bookIndex > 0) {
      const prev = ALL_BOOKS[bookIndex - 1];
      setBookIndex(bookIndex - 1);
      setChapter(prev.chapters);
    }
  };

  const nextChapter = () => {
    if (chapter < book.chapters) {
      setChapter((c) => c + 1);
    } else if (bookIndex < ALL_BOOKS.length - 1) {
      setBookIndex(bookIndex + 1);
      setChapter(1);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseReference(searchInput);
    if (!parsed) {
      setSearchError('Try "John 3:16" or "Psalm 23"');
      return;
    }
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
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
      setSearchError('Reference not found. Try "John 3:16" or "Genesis 1".');
    } finally {
      setSearching(false);
    }
  };

  const insertVerse = (v: BibleVerse) => {
    const ref = `${v.book_name} ${v.chapter}:${v.verse}`;
    const transLabel = TRANSLATIONS.find((t) => t.id === translation)?.label ?? translation.toUpperCase();
    // Format: verse text, then citation on next line for blockquote styling in editor
    onInsert(`${v.text.trim()}\n\n— ${ref} (${transLabel})`);
  };

  const insertSelected = () => {
    if (selectedVerse === null) return;
    const v = verses.find((x) => x.verse === selectedVerse);
    if (v) insertVerse(v);
  };

  return (
    <div
      className="flex flex-col h-full border-l border-dashboard-border bg-dashboard-card"
      style={{ width: 380, minWidth: 320, ...BOOK_FONT }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dashboard-border shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-dashboard-text-muted" />
          <span className="text-sm font-semibold text-dashboard-text" style={BOOK_FONT}>Holy Bible</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="h-7 rounded border border-dashboard-border bg-dashboard-card-hover px-1.5 text-xs text-dashboard-text-muted focus:outline-none cursor-pointer"
            style={BOOK_FONT}
          >
            {TRANSLATIONS.map((t) => (
              <option key={t.id} value={t.id} style={{ background: "hsl(var(--dashboard-card))" }}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            onClick={onClose}
            className="rounded p-1 text-dashboard-text-muted hover:text-dashboard-text transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-dashboard-border shrink-0">
        {(["browse", "search"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={BOOK_FONT}
            className={[
              "flex-1 py-2 text-xs font-medium transition-colors",
              tab === t
                ? "text-dashboard-text border-b-2 border-dashboard-text"
                : "text-dashboard-text-muted hover:text-dashboard-text",
            ].join(" ")}
          >
            {t === "browse" ? "Browse" : "Look Up"}
          </button>
        ))}
      </div>

      {tab === "browse" ? (
        <>
          {/* ── Navigation ── */}
          <div className="px-3 pt-3 pb-2 border-b border-dashboard-border shrink-0 space-y-2">
            <div className="flex gap-2">
              {/* Book */}
              <select
                value={bookIndex}
                onChange={(e) => { setBookIndex(Number(e.target.value)); setChapter(1); }}
                className="flex-1 h-8 rounded border border-dashboard-border bg-dashboard-card-hover px-2 text-sm text-dashboard-text focus:outline-none cursor-pointer"
                style={BOOK_FONT}
              >
                <optgroup label="— Old Testament —" style={{ background: "hsl(var(--dashboard-card))", fontSize: 11 }}>
                  {OT.map((b, i) => (
                    <option key={b.id} value={i} style={{ background: "hsl(var(--dashboard-card))", color: "hsl(var(--dashboard-text))" }}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="— New Testament —" style={{ background: "hsl(var(--dashboard-card))", fontSize: 11 }}>
                  {NT.map((b, i) => (
                    <option key={b.id} value={OT.length + i} style={{ background: "hsl(var(--dashboard-card))", color: "hsl(var(--dashboard-text))" }}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              {/* Chapter */}
              <input
                type="number"
                min={1}
                max={book.chapters}
                value={chapter}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (v >= 1 && v <= book.chapters) setChapter(v);
                }}
                className="w-16 h-8 rounded border border-dashboard-border bg-dashboard-card-hover px-2 text-sm text-dashboard-text text-center focus:outline-none"
                style={BOOK_FONT}
                title={`Chapter 1–${book.chapters}`}
              />
            </div>

            {/* Current reference label */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-dashboard-text-muted text-center truncate" style={BOOK_FONT}>
              {loading ? "Loading…" : (reference || `${book.name} ${chapter}`)}
            </p>
          </div>

          {/* ── Book-format chapter text ── */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-dashboard-text-muted" />
              </div>
            )}
            {error && !loading && (
              <div className="flex items-center gap-2 text-rose-400 text-sm p-5">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            {!loading && !error && verses.length > 0 && (
              <div className="px-6 pt-5 pb-6">
                {/* Chapter number header */}
                <p
                  className="text-5xl font-light text-dashboard-text-muted/30 mb-3 select-none"
                  style={BOOK_FONT}
                >
                  {chapter}
                </p>
                {/* Flowing verse text */}
                <p
                  className="text-[15px] leading-[1.85] text-dashboard-text"
                  style={BOOK_FONT}
                >
                  {verses.map((v) => (
                    <span
                      key={v.verse}
                      ref={(el) => { verseRefs.current[v.verse] = el; }}
                      onClick={() => setSelectedVerse(v.verse === selectedVerse ? null : v.verse)}
                      title={`${book.name} ${chapter}:${v.verse} — click to select`}
                      className={[
                        "cursor-pointer rounded transition-colors",
                        selectedVerse === v.verse
                          ? "bg-amber-400/25 ring-1 ring-amber-400/40"
                          : "hover:bg-dashboard-card-hover",
                      ].join(" ")}
                    >
                      <sup
                        className="select-none"
                        style={{ color: "hsl(var(--dashboard-text-muted))", opacity: 0.55, fontSize: "0.6em", marginRight: 1 }}
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

          {/* ── Sticky bottom bar: insert + chapter pagination ── */}
          <div className="shrink-0 border-t border-dashboard-border bg-dashboard-card">
            {selectedVerse !== null && (
              <div className="px-4 py-2 flex items-center justify-between gap-2 border-b border-dashboard-border bg-amber-400/5">
                <span className="text-xs text-dashboard-text-muted" style={BOOK_FONT}>
                  {book.name} {chapter}:{selectedVerse}
                </span>
                <button
                  onClick={insertSelected}
                  className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors shrink-0"
                  style={BOOK_FONT}
                >
                  <Plus className="h-3.5 w-3.5" /> Insert verse
                </button>
              </div>
            )}
            {/* Chapter prev / next */}
            <div className="flex items-stretch">
              <button
                onClick={prevChapter}
                disabled={bookIndex === 0 && chapter === 1}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card-hover disabled:opacity-30 transition-colors border-r border-dashboard-border"
                style={BOOK_FONT}
                title="Previous chapter"
              >
                <ChevronLeft className="h-4 w-4" />
                {bookIndex === 0 && chapter === 1 ? "Start" : (
                  chapter === 1
                    ? <span className="truncate max-w-[110px]">{ALL_BOOKS[bookIndex - 1]?.name} {ALL_BOOKS[bookIndex - 1]?.chapters}</span>
                    : <span>{book.name} {chapter - 1}</span>
                )}
              </button>
              <button
                onClick={nextChapter}
                disabled={bookIndex === ALL_BOOKS.length - 1 && chapter === book.chapters}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card-hover disabled:opacity-30 transition-colors"
                style={BOOK_FONT}
                title="Next chapter"
              >
                {bookIndex === ALL_BOOKS.length - 1 && chapter === book.chapters ? "End" : (
                  chapter === book.chapters
                    ? <span className="truncate max-w-[110px]">{ALL_BOOKS[bookIndex + 1]?.name} 1</span>
                    : <span>{book.name} {chapter + 1}</span>
                )}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ── Look Up tab ── */
        <div className="flex flex-col flex-1 overflow-hidden">
          <form onSubmit={handleSearch} className="px-3 py-3 border-b border-dashboard-border shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-text-muted" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="John 3:16 or Psalm 23"
                  className="w-full h-8 rounded border border-dashboard-border bg-dashboard-card-hover pl-8 pr-3 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none focus:ring-1 focus:ring-dashboard-border"
                  style={BOOK_FONT}
                />
              </div>
              <button
                type="submit"
                disabled={searching || !searchInput.trim()}
                className="rounded bg-dashboard-card-hover hover:bg-dashboard-border disabled:opacity-40 px-3 py-1.5 text-xs font-semibold text-dashboard-text transition-colors border border-dashboard-border"
                style={BOOK_FONT}
              >
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Go"}
              </button>
            </div>
            {searchError && <p className="mt-1.5 text-xs text-rose-400" style={BOOK_FONT}>{searchError}</p>}
          </form>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {searchResults.length > 0 && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-dashboard-text-muted mb-3" style={BOOK_FONT}>
                  {searchRef}
                </p>
                <p className="text-[15px] leading-[1.85] text-dashboard-text" style={BOOK_FONT}>
                  {searchResults.map((v) => (
                    <span key={v.verse} className="group relative">
                      <sup
                        className="text-[9px] font-bold mr-[2px] ml-[1px] select-none"
                        style={{ color: "hsl(var(--dashboard-text-muted))", opacity: 0.6, verticalAlign: "super", fontSize: "0.6em" }}
                      >
                        {v.verse}
                      </sup>
                      {v.text.trim()}{" "}
                      <button
                        onClick={() => insertVerse(v)}
                        title="Insert into note"
                        className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold text-dashboard-text-muted bg-dashboard-card-hover hover:text-dashboard-text transition-colors opacity-0 group-hover:opacity-100 mx-0.5"
                        style={BOOK_FONT}
                      >
                        <Plus className="h-2.5 w-2.5" /> insert
                      </button>
                    </span>
                  ))}
                </p>
              </>
            )}
            {searchResults.length === 0 && !searching && !searchError && (
              <div className="py-12 text-center">
                <BookOpen className="mx-auto h-7 w-7 text-dashboard-text-muted/25 mb-3" />
                <p className="text-sm text-dashboard-text-muted" style={BOOK_FONT}>Enter a reference above</p>
                <p className="text-xs text-dashboard-text-muted/50 mt-1" style={BOOK_FONT}>e.g. "Romans 8:28" or "Psalm 23"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
