export default function OrgLoading() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero skeleton */}
      <div className="relative h-40 sm:h-48 md:h-56 animate-pulse bg-slate-700" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-5 bg-white rounded-tl-xl rounded-tr-xl -mt-14 sm:-mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-5">
          <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full animate-pulse bg-slate-200 border-4 border-white shrink-0" />
          <div className="flex-1 pt-4 pb-6 sm:pt-0 sm:pb-8 space-y-3">
            <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="flex gap-2 mt-4">
              <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
      {/* About skeleton */}
      <div className="bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-5">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200" />
            <div className="space-y-6">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-6 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
