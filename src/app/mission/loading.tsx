export default function MissionLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
        </div>
        <p className="text-sm font-medium text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
