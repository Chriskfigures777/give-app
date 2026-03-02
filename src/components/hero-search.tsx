"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Search, Calendar } from "lucide-react";

const PLACEHOLDER_AVATAR =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80";

type OrgResult = {
  id: string;
  name: string;
  slug: string;
  org_type: string | null;
  city: string | null;
  state: string | null;
  causes: string[];
  logo_url?: string | null;
  profile_image_url?: string | null;
};

type EventResult = {
  id: string;
  name: string;
  slug: string;
  start_at: string;
  org: { name: string; slug: string } | null;
};

const DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 2;
const QUICK_CHIPS = [
  { label: "Churches", type: "church" },
  { label: "Missionaries", type: "missionary" },
  { label: "Nonprofits", type: "nonprofit" },
  { label: "Events", type: "event" },
];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ organizations: OrgResult[]; events: EventResult[] }>({
    organizations: [],
    events: [],
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      setResults({ organizations: [], events: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: term, type: "all", limit: "8" });
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults({
        organizations: data.organizations ?? [],
        events: data.events ?? [],
      });
    } catch {
      setResults({ organizations: [], events: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults({ organizations: [], events: [] });
      setOpen(false);
      setLoading(false);
      setHighlightIndex(-1);
      return;
    }
    setOpen(true);
    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flatResults = [
    ...results.organizations.map((o) => ({ type: "org" as const, data: o })),
    ...results.events.map((e) => ({ type: "event" as const, data: e })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || flatResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i < flatResults.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : flatResults.length - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0 && flatResults[highlightIndex]) {
      e.preventDefault();
      const item = flatResults[highlightIndex];
      if (item.type === "org") router.push(`/org/${item.data.slug}`);
      else router.push(`/events/${item.data.id}`);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    }
  };

  const showDropdown = open && (focused || flatResults.length > 0 || loading);
  const displayResults = query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative w-full mx-auto">
      {/* Search bar */}
      <div className="relative group">
        <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-white/50 transition-colors group-focus-within:text-emerald-400">
          <Search className="h-6 w-6" />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Find churches, missionaries, nonprofits, or events…"
          className="w-full rounded-full border border-white/[0.15] bg-white/[0.07] py-5 pl-16 pr-16 text-lg text-white placeholder:text-white/40 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition-all duration-300 focus:border-emerald-400/40 focus:bg-white/[0.1] focus:shadow-[0_8px_50px_rgba(16,185,129,0.12)] focus:outline-none focus:ring-2 focus:ring-emerald-400/20 sm:py-6 sm:pl-18 sm:pr-20 sm:text-xl"
          autoComplete="off"
          aria-expanded={showDropdown}
          aria-controls="hero-search-results"
          aria-autocomplete="list"
          role="combobox"
          aria-label="Search churches, missionaries, nonprofits, and events"
        />
        {loading ? (
          <span className="absolute right-6 top-1/2 -translate-y-1/2 sm:right-7" aria-hidden>
            <svg className="h-6 w-6 animate-spin text-white/40" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => { if (query.trim()) router.push(`/explore?q=${encodeURIComponent(query)}`); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500 p-2.5 text-white shadow-lg transition-all hover:bg-emerald-400 hover:shadow-emerald-500/25 active:scale-95 sm:right-4 sm:p-3"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="mt-6 flex flex-wrap justify-center gap-2.5 sm:gap-3">
        {QUICK_CHIPS.map((chip) => (
          <Link
            key={chip.label}
            href={
              chip.type
                ? `/explore?type=${chip.type}`
                : "/explore"
            }
            className="rounded-full border border-white/[0.1] bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/70 backdrop-blur-sm transition-all duration-200 hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-white sm:px-6 sm:py-3 sm:text-base"
          >
            {chip.label}
          </Link>
        ))}
      </div>

      <AnimatePresence>
        {showDropdown && displayResults && (
          <motion.div
            id="hero-search-results"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            role="listbox"
            className="absolute top-full left-0 right-0 z-50 mt-3 max-h-[min(420px,60vh)] overflow-auto rounded-3xl border border-slate-200/80 bg-white py-3 shadow-2xl"
          >
            {loading && flatResults.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500">Searching…</div>
            ) : flatResults.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500">
                No results found. Try another search.
              </div>
            ) : (
              <ul className="py-1">
                {results.organizations.length > 0 && (
                  <li className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Organizations
                  </li>
                )}
                {results.organizations.map((org, i) => {
                  const idx = i;
                  const isHighlighted = highlightIndex === idx;
                  return (
                    <li key={`org-${org.id}`} role="option" aria-selected={isHighlighted}>
                      <Link
                        href={`/org/${org.slug}`}
                        onMouseEnter={() => setHighlightIndex(idx)}
                        className={`flex items-center gap-3 px-4 py-3 text-left transition ${
                          isHighlighted ? "bg-emerald-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
                          <Image
                            src={org.profile_image_url ?? org.logo_url ?? PLACEHOLDER_AVATAR}
                            alt={org.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-slate-900">{org.name}</span>
                          {org.city && (
                            <span className="ml-2 text-sm text-slate-500">
                              {org.city}, {org.state}
                            </span>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            org.org_type === "church"
                              ? "bg-amber-100 text-amber-800"
                              : org.org_type === "missionary"
                                ? "bg-violet-100 text-violet-800"
                                : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {org.org_type === "church" ? "Church" : org.org_type === "missionary" ? "Missionary" : "Nonprofit"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {results.events.length > 0 && (
                  <li className="mt-2 border-t border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Events
                  </li>
                )}
                {results.events.map((ev, i) => {
                  const idx = results.organizations.length + i;
                  const isHighlighted = highlightIndex === idx;
                  return (
                    <li key={`ev-${ev.id}`} role="option" aria-selected={isHighlighted}>
                      <Link
                        href={`/events/${ev.id}`}
                        onMouseEnter={() => setHighlightIndex(idx)}
                        className={`flex items-center gap-3 px-4 py-3 text-left transition ${
                          isHighlighted ? "bg-emerald-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <Calendar className="h-10 w-10 shrink-0 rounded-lg bg-violet-100 p-2 text-violet-600" />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-slate-900">{ev.name}</span>
                          {ev.org && (
                            <span className="ml-2 text-sm text-slate-500">{ev.org.name}</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(ev.start_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                <li className="border-t border-slate-100">
                  <Link
                    href={`/explore?q=${encodeURIComponent(query)}`}
                    className="block px-4 py-3 text-center text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                  >
                    View all results
                  </Link>
                </li>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
