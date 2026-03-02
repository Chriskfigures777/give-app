export default function FeedLoading() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      <div className="mx-auto flex w-full max-w-[1680px] justify-start gap-8 px-4 py-8 sm:px-6 lg:gap-10 xl:gap-12 xl:px-10">
        <aside className="hidden w-[240px] shrink-0 xl:block">
          <div className="space-y-6">
            <div className="feed-shimmer h-20 rounded-xl" />
            <div className="feed-shimmer h-64 rounded-xl" />
          </div>
        </aside>
        <div className="min-w-[min(100%,360px)] flex-1 lg:min-w-[500px] lg:max-w-[680px]">
          <div className="mb-6">
            <div className="feed-shimmer h-8 w-32 rounded" />
            <div className="mt-1 feed-shimmer h-4 w-48 rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="feed-shimmer h-40 rounded-xl" />
            ))}
          </div>
        </div>
        <aside className="hidden w-[300px] shrink-0 lg:block">
          <div className="feed-shimmer h-32 rounded-xl" />
          <div className="mt-4 feed-shimmer h-80 rounded-xl" />
        </aside>
      </div>
    </main>
  );
}
