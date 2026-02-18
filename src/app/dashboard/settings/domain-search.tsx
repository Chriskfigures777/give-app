"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Globe, Check, Loader2, ExternalLink, ShoppingCart, Sparkles, Info } from "lucide-react";

type DomainResult = {
  available: boolean;
  domain: string;
  price: number;
  currency: string;
  period: number;
  definitive: boolean;
};

function formatPrice(price: number, currency: string) {
  const amt = price / 1000000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amt);
}

export function DomainSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) return;
    setSearching(true);
    setError(null);
    setNote(null);
    setSearched(false);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
      if (data.note) setNote(data.note);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(val.trim()), 600);
    } else {
      setResults([]);
      setSearched(false);
      setNote(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) doSearch(query.trim());
  };

  const handleBuyDomain = (domain: string) => {
    window.open(
      `https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(domain)}`,
      "_blank"
    );
  };

  const available = results.filter((r) => r.available);
  const isFallback = note !== null;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search for a domain name..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-24 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
          />
          <button
            type="submit"
            disabled={searching || query.trim().length < 2}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-emerald-700 disabled:opacity-40 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {searching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Results — only available domains */}
      {searched && available.length > 0 && !isFallback && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Available domains
            </span>
          </div>
          <div className="space-y-1.5">
            {available.map((r) => (
              <div
                key={r.domain}
                className="group flex items-center justify-between gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/40 px-4 py-3 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/80 hover:shadow-sm dark:border-emerald-800/40 dark:bg-emerald-900/10 dark:hover:border-emerald-700/60 dark:hover:bg-emerald-900/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {r.domain}
                    </p>
                    {r.price > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatPrice(r.price, r.currency)}/yr
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleBuyDomain(r.domain)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-emerald-700 group-hover:shadow-md dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <ShoppingCart className="h-3 w-3" />
                  Get domain
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No available domains found */}
      {searched && available.length === 0 && !isFallback && !error && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-6 text-center dark:border-slate-700 dark:bg-slate-800/20">
          <Globe className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No available domains found for &ldquo;{query}&rdquo;
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Try a different name or variation
          </p>
        </div>
      )}

      {/* Fallback — show domain suggestions with external registrar links */}
      {searched && isFallback && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-blue-200/60 bg-blue-50/40 p-3 dark:border-blue-800/40 dark:bg-blue-900/10">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Showing domain suggestions. Click any domain to check availability and purchase from a registrar.
            </p>
          </div>
          <div className="space-y-1.5">
            {results.map((r) => (
              <button
                key={r.domain}
                type="button"
                onClick={() => handleBuyDomain(r.domain)}
                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/60 bg-white px-4 py-3 text-left transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:border-emerald-700/50 dark:hover:bg-emerald-900/10"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-emerald-500/10 dark:bg-slate-700/50 dark:group-hover:bg-emerald-500/20">
                    <Globe className="h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400" />
                  </div>
                  <p className="truncate text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">
                    {r.domain}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-400 transition-colors group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400">
                  Check availability
                  <ExternalLink className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!searched && !searching && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-5 text-center dark:border-slate-700 dark:bg-slate-800/20">
          <Globe className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter a name to search for available domains
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            We&apos;ll check .com, .org, .net, .church, and more
          </p>
        </div>
      )}
    </div>
  );
}
