export default function ExploreLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Search skeleton */}
        <div className="mb-8">
          <div className="h-12 w-full max-w-xl animate-pulse rounded-2xl bg-slate-200/60" />
        </div>
        {/* Filters skeleton */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-slate-200/50" />
          ))}
        </div>
        {/* Results grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-4">
              <div className="h-32 animate-pulse rounded-xl bg-slate-200/50" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200/60" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
