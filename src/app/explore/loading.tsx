export default function ExploreLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[400px] left-1/4 h-[800px] w-[800px] rounded-full bg-emerald-100/30 blur-[120px]" />
        <div className="absolute -top-[200px] right-1/3 h-[600px] w-[600px] rounded-full bg-teal-100/25 blur-[100px]" />
      </div>

      {/* Hero section skeleton */}
      <section className="relative border-b border-white/60 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-xl shadow-emerald-900/10">
        <div className="relative mx-auto max-w-4xl px-6 py-14 md:py-20">
          <div className="text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-2xl bg-white/15" />
            <div className="mx-auto mb-4 h-10 w-96 max-w-full animate-pulse rounded-lg bg-white/20" />
            <div className="mx-auto mb-8 h-6 w-80 max-w-full animate-pulse rounded bg-white/15" />
            <div className="mx-auto h-14 w-full max-w-2xl animate-pulse rounded-2xl bg-white/15" />
          </div>
        </div>
      </section>

      {/* Content skeleton */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        {/* Cause chips skeleton */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-slate-200/50" />
          ))}
        </div>
        {/* Filters skeleton */}
        <div className="mb-8 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-28 animate-pulse rounded-xl bg-slate-200/50" />
            ))}
          </div>
        </div>
        {/* Results grid skeleton - orgs + events */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-xl"
            >
              <div className="feed-shimmer aspect-[3/2] rounded-t-2xl" />
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
      </div>
    </main>
  );
}
