export default function FeedLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      <div className="relative z-10 mx-auto flex w-full max-w-[1680px] justify-start gap-6 px-4 py-6 sm:px-6 lg:gap-8 xl:gap-10 xl:px-10">
        {/* Left sidebar skeleton */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-200/60" />
            ))}
          </div>
        </aside>
        {/* Feed skeleton */}
        <div className="min-w-0 flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200/60" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200/40" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3.5 w-full animate-pulse rounded bg-slate-200/40" />
                <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-200/40" />
              </div>
            </div>
          ))}
        </div>
        {/* Right panel skeleton */}
        <aside className="hidden w-72 shrink-0 xl:block">
          <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4">
            <div className="h-5 w-24 animate-pulse rounded bg-slate-200/60" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-200/40" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
