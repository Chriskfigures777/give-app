export default function GiveLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 bg-[var(--stripe-light-grey)]">
      <div className="w-full max-w-[480px] overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-md">
        <div className="h-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
          <div className="mt-6 flex min-h-[120px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          </div>
        </div>
      </div>
    </main>
  );
}
