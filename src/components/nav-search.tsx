"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Church, Heart, Calendar } from "lucide-react";

type OrgResult = {
  id: string;
  name: string;
  slug: string;
  org_type: string | null;
  city: string | null;
  state: string | null;
  causes: string[];
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

export function NavSearch({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ organizations: OrgResult[]; events: EventResult[] }>({
    organizations: [],
    events: [],
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const showDropdown = open && (focused || flatResults.length > 0 || loading);
  const displayResults = query.trim().length >= MIN_QUERY_LENGTH;

  const handleSelect = (item: { type: "org" | "event"; data: OrgResult | EventResult }) => {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    if (item.type === "org") router.push(`/org/${(item.data as OrgResult).slug}`);
    else router.push(`/events/${(item.data as EventResult).id}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[280px] lg:max-w-[320px]">
      <label htmlFor="nav-search-input" className="sr-only">
        Search churches, nonprofits, and events
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          id="nav-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Find churches, nonprofits, events…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          autoComplete="off"
          aria-expanded={showDropdown}
          aria-controls="nav-search-results"
          aria-autocomplete="list"
          role="combobox"
          aria-label="Search churches, nonprofits, and events"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden>
            <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && displayResults && (
          <motion.div
            id="nav-search-results"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute top-full left-0 right-0 z-50 mt-2 max-h-[min(360px,60vh)] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          >
            {loading && flatResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">Searching…</div>
            ) : flatResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                No results found. Try another search.
              </div>
            ) : (
              <ul className="py-1">
                {results.organizations.length > 0 && (
                  <li className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Organizations
                  </li>
                )}
                {results.organizations.map((org) => (
                  <li key={org.id} role="option">
                    <button
                      type="button"
                      onClick={() => handleSelect({ type: "org", data: org })}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-slate-900"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        {org.org_type === "church" ? (
                          <Church className="h-4 w-4 text-amber-600" />
                        ) : org.org_type === "missionary" ? (
                          <Heart className="h-4 w-4 text-violet-600" />
                        ) : (
                          <Heart className="h-4 w-4 text-sky-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium truncate block">{org.name}</span>
                        {org.city && (
                          <span className="text-xs text-slate-500">{org.city}, {org.state}</span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          org.org_type === "church"
                            ? "bg-amber-100 text-amber-800"
                            : org.org_type === "nonprofit"
                              ? "bg-sky-100 text-sky-800"
                              : org.org_type === "missionary"
                                ? "bg-violet-100 text-violet-800"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {org.org_type === "church" ? "Church" : org.org_type === "nonprofit" ? "Nonprofit" : org.org_type === "missionary" ? "Missionary" : "Org"}
                      </span>
                    </button>
                  </li>
                ))}
                {results.events.length > 0 && (
                  <li className="mt-1 border-t border-slate-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Events
                  </li>
                )}
                {results.events.map((ev) => (
                  <li key={ev.id} role="option">
                    <button
                      type="button"
                      onClick={() => handleSelect({ type: "event", data: ev })}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-slate-900"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                        <Calendar className="h-4 w-4 text-violet-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium truncate block">{ev.name}</span>
                        {ev.org && (
                          <span className="text-xs text-slate-500">{ev.org.name}</span>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-slate-500">
                        {new Date(ev.start_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </button>
                  </li>
                ))}
                <li className="border-t border-slate-100">
                  <Link
                    href={`/explore?q=${encodeURIComponent(query)}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                      onNavigate?.();
                    }}
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
