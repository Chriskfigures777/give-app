"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Heart,
  CreditCard,
  MessageSquare,
  Users,
  Settings,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/feed", label: "Feed", icon: LayoutDashboard, gradient: "from-emerald-500 to-teal-500" },
  { href: "/explore", label: "Explore", icon: Compass, gradient: "from-cyan-500 to-blue-500" },
  { href: "/dashboard/connections", label: "Peers", icon: Users, gradient: "from-violet-500 to-indigo-500" },
  { href: "/dashboard/my-donations", label: "My Donations", icon: CreditCard, gradient: "from-violet-500 to-purple-500" },
  { href: "/dashboard", label: "Dashboard", icon: Heart, gradient: "from-rose-500 to-pink-500" },
  { href: "/messages", label: "Messages", icon: MessageSquare, gradient: "from-amber-500 to-orange-500" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, gradient: "from-slate-500 to-slate-600" },
];

export function FeedLeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[260px] shrink-0 xl:block">
      <div className="sticky top-24 space-y-2">
        {/* Quick-access nav card */}
        <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2 px-2">
            <Sparkles className="h-4 w-4 text-emerald-500" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </span>
          </div>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50/50 text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                  )}
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-br ${item.gradient} text-white shadow-sm`
                        : "bg-slate-100/80 text-slate-500 group-hover:bg-slate-200/60 group-hover:text-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Give promo card */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[1px]">
          <div className="rounded-[15px] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4">
            <p className="text-sm font-semibold text-white">
              Share the gift of giving
            </p>
            <p className="mt-1 text-xs text-emerald-100/90">
              Invite your community to join Give and make an impact together.
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-flex items-center rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              Explore organizations
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
