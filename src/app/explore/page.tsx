"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Compass, Sparkles, Search } from "lucide-react";
import { HeroSearch } from "@/components/hero-search";
import { CauseChips } from "@/components/explore/cause-chips";
import { ExploreFilters } from "@/components/explore/explore-filters";
import { OrgResultCard } from "@/components/explore/org-result-card";
import { EventResultCard } from "@/components/explore/event-result-card";
import type { SearchOrgResult, SearchEventResult } from "@/app/api/search/route";

function ExploreContent() {
  const searchParams = useSearchParams();
  const [organizations, setOrganizations] = useState<SearchOrgResult[]>([]);
  const [events, setEvents] = useState<SearchEventResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "all";
  const city = searchParams.get("city") ?? "";
  const cause = searchParams.get("cause") ?? "";

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type && type !== "all") params.set("type", type);
      if (city) params.set("city", city);
      if (cause) params.set("cause", cause);
      params.set("limit", "24");

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setOrganizations(data.organizations ?? []);
      setEvents(data.events ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setOrganizations([]);
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [q, type, city, cause]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const showOrgs = type === "all" || type === "church" || type === "nonprofit" || type === "missionary";
  const showEvents = type === "all" || type === "event";
  const hasResults = organizations.length > 0 || events.length > 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      {/* Ambient gradient orbs for depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[400px] left-1/4 h-[800px] w-[800px] rounded-full bg-emerald-100/30 blur-[120px]" />
        <div className="absolute -top-[200px] right-1/3 h-[600px] w-[600px] rounded-full bg-teal-100/25 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[600px] rounded-full bg-cyan-50/20 blur-[80px]" />
      </div>

      {/* Hero section */}
      <section className="relative border-b border-white/60 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-xl shadow-emerald-900/10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.06] blur-[80px]" />
          <div className="absolute -bottom-1/3 right-0 h-[400px] w-[400px] rounded-full bg-teal-400/10 blur-[60px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMC41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDcpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-60" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
            >
              <Compass className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Find churches, missionaries,{" "}
              <br className="hidden sm:block" />
              and nonprofits
            </h1>
            <p className="mt-4 text-lg text-emerald-100/90">
              Discover organizations making a difference. Giving made simple.
            </p>
            <div className="mt-8">
              <HeroSearch />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <CauseChips />
        <ExploreFilters />

        {/* Result count */}
        {!loading && hasResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-2"
          >
            <span className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-700">{total}</span>{" "}
              {total === 1 ? "result" : "results"}
              {q && (
                <>
                  {" "}for &ldquo;<span className="font-medium text-slate-700">{q}</span>&rdquo;
                </>
              )}
            </span>
          </motion.div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-xl"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="p-1">
                  <div className="feed-shimmer aspect-[3/2] rounded-xl" />
                </div>
                <div className="space-y-2.5 p-4">
                  <div className="feed-shimmer h-5 w-3/4 rounded-lg" />
                  <div className="feed-shimmer h-4 w-full rounded-lg" />
                  <div className="feed-shimmer h-4 w-1/2 rounded-lg" />
                  <div className="flex gap-2 pt-1">
                    <div className="feed-shimmer h-6 w-16 rounded-full" />
                    <div className="feed-shimmer h-6 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !hasResults ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/60 bg-white/70 py-20 text-center shadow-sm backdrop-blur-xl"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-700">No results found</p>
            <p className="mx-auto mt-2 max-w-sm text-slate-500">
              Try adjusting your search or filters to discover more organizations and events.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {showOrgs && organizations.length > 0 && (
              <section>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Organizations
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                    {organizations.length}
                  </span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {organizations.map((org, i) => (
                    <OrgResultCard key={org.id} org={org} index={i} />
                  ))}
                </div>
              </section>
            )}
            {showEvents && events.length > 0 && (
              <section>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Upcoming Events
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                    {events.length}
                  </span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {events.map((ev, i) => (
                    <EventResultCard key={ev.id} event={ev} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-[400px] left-1/4 h-[800px] w-[800px] rounded-full bg-emerald-100/30 blur-[120px]" />
        </div>
        <div className="relative border-b border-white/60 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-xl shadow-emerald-900/10">
          <div className="mx-auto max-w-4xl px-6 py-14 md:py-20">
            <div className="mx-auto h-44 max-w-2xl animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>
      </main>
    }>
      <ExploreContent />
    </Suspense>
  );
}
