"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type OrgResult = {
  id: string;
  name: string;
  slug: string;
  org_type: string | null;
};

const DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 2;

export function NavSearch({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrgResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim().toLowerCase();
    if (term.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, slug, org_type")
      .not("stripe_connect_account_id", "is", null)
      .or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
      .limit(10);
    setLoading(false);
    if (error) {
      setResults([]);
      return;
    }
    setResults((data ?? []) as OrgResult[]);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
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

  const showDropdown = open && (focused || results.length > 0 || loading);
  const displayResults = query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative w-full max-w-[220px] lg:max-w-[260px]">
      <label htmlFor="nav-search-input" className="sr-only">
        Search churches and nonprofits
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
          placeholder="Find a church or nonprofit…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          autoComplete="off"
          aria-expanded={showDropdown}
          aria-controls="nav-search-results"
          aria-autocomplete="list"
          role="combobox"
          aria-label="Search churches and nonprofits"
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

      {showDropdown && displayResults && (
        <div
          id="nav-search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[min(320px,60vh)] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {loading && results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              No churches or nonprofits found. Try another name.
            </div>
          ) : (
            <ul className="py-1">
              {results.map((org) => (
                <li key={org.id} role="option">
                  <Link
                    href={`/give/${org.slug}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                      onNavigate?.();
                    }}
                    className="flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-slate-900"
                  >
                    <span className="font-medium truncate">{org.name}</span>
                    {org.org_type && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          org.org_type === "church"
                            ? "bg-amber-100 text-amber-800"
                            : org.org_type === "nonprofit"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {org.org_type === "church" ? "Church" : org.org_type === "nonprofit" ? "Nonprofit" : "Org"}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
