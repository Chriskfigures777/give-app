"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X, Church, Heart, Globe, CalendarDays, LayoutGrid, MapPin } from "lucide-react";

type FilterType = "all" | "church" | "nonprofit" | "missionary" | "event";

const TYPE_OPTIONS: { id: FilterType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "church", label: "Churches", icon: Church },
  { id: "nonprofit", label: "Nonprofits", icon: Heart },
  { id: "missionary", label: "Missionaries", icon: Globe },
  { id: "event", label: "Events", icon: CalendarDays },
];

export function ExploreFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const type = (searchParams.get("type") ?? "all") as FilterType;
  const city = searchParams.get("city") ?? "";
  const cause = searchParams.get("cause") ?? "";

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete("offset");
    router.push(`/explore?${params.toString()}`);
  };

  const hasActiveFilters = city || cause || type !== "all";

  return (
    <div className="mb-8 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Type pills */}
        <div className="flex items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Type
          </span>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {TYPE_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => updateParams({ type: id })}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  type === id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${type === id ? "text-emerald-100" : "text-slate-400"}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Location + clear */}
        <div className="flex items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Location
          </span>
          <button
            type="button"
            onClick={() => updateParams({ city: city === "Grand Rapids" ? "" : "Grand Rapids" })}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
              city === "Grand Rapids"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <MapPin className={`h-3.5 w-3.5 ${city === "Grand Rapids" ? "text-emerald-100" : "text-slate-400"}`} />
            Grand Rapids
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => router.push("/explore")}
              className="ml-2 flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition-all duration-200 hover:bg-rose-100"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
