export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-2 sm:p-4 max-w-[1400px] mx-auto">
      {/* Welcome banner skeleton */}
      <div className="rounded-2xl overflow-hidden h-36 animate-pulse bg-gradient-to-r from-emerald-100 via-teal-50 to-cyan-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />

      {/* Header skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-dashboard-card-hover/70" />
          <div className="h-4 w-48 animate-pulse rounded-lg bg-dashboard-card-hover/50" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded-xl bg-dashboard-card-hover/70" />
          <div className="h-10 w-20 animate-pulse rounded-xl bg-dashboard-card-hover/70" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-3 w-20 animate-pulse rounded bg-dashboard-card-hover/50" />
                <div className="h-7 w-28 animate-pulse rounded-lg bg-dashboard-card-hover/70" />
                <div className="h-3 w-24 animate-pulse rounded bg-dashboard-card-hover/40" />
              </div>
              <div className="h-11 w-11 animate-pulse rounded-2xl bg-dashboard-card-hover/50" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5">
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-dashboard-card-hover/70" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-dashboard-card-hover/30" />
        </div>
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5">
          <div className="mb-4 h-4 w-40 animate-pulse rounded bg-dashboard-card-hover/70" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-dashboard-card-hover/30" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden">
        <div className="border-b border-dashboard-border px-5 py-4">
          <div className="h-4 w-32 animate-pulse rounded bg-dashboard-card-hover/70" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-dashboard-card-hover/50" />
              <div className="h-4 flex-1 animate-pulse rounded bg-dashboard-card-hover/40" />
              <div className="h-4 w-16 animate-pulse rounded bg-dashboard-card-hover/40" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-dashboard-card-hover/40" />
              <div className="h-4 w-20 animate-pulse rounded bg-dashboard-card-hover/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
