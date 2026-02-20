"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Compass,
  Heart,
  CreditCard,
  MessageSquare,
  Users,
  Settings,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useUser } from "@/lib/use-user";
import { BrandMark } from "@/components/brand-mark";

const NAV_ITEMS = [
  { href: "/feed", label: "Feed", icon: LayoutGrid, gradient: "from-emerald-500 to-teal-500" },
  { href: "/explore", label: "Explore", icon: Compass, gradient: "from-cyan-500 to-blue-500" },
  { href: "/dashboard/connections", label: "Peers", icon: Users, gradient: "from-violet-500 to-indigo-500" },
  { href: "/dashboard/my-donations", label: "My Donations", icon: CreditCard, gradient: "from-violet-500 to-purple-500" },
  { href: "/dashboard", label: "Dashboard", icon: Heart, gradient: "from-rose-500 to-pink-500" },
  { href: "/messages", label: "Messages", icon: MessageSquare, gradient: "from-amber-500 to-orange-500" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, gradient: "from-slate-500 to-slate-600" },
];

export function FeedLeftSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const name = (user?.user_metadata?.full_name as string) ?? (user?.user_metadata?.name as string) ?? user?.email?.split("@")[0] ?? "there";
  const displayName = name.split(" ")[0];
  const avatarUrl = (user?.user_metadata?.avatar_url as string) ?? (user?.user_metadata?.picture as string) ?? null;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="hidden w-[260px] shrink-0 xl:block">
      <div className="sticky top-24 space-y-3">
        {/* User profile card */}
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-xl">
          <div className="relative h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%22.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')] opacity-[0.06]" />
          </div>
          <div className="relative px-4 pb-4">
            <div className="-mt-6 flex items-end gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-[3px] border-white bg-gradient-to-br from-emerald-200 to-teal-200 shadow-sm">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill className="object-cover" sizes="48px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-emerald-700">{initial}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 pb-0.5">
                <p className="truncate text-sm font-semibold text-slate-900">Welcome, {displayName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick-access nav card */}
        <div className="rounded-2xl border border-white/60 bg-white/80 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-xl">
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

        {/* Community impact card */}
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-xl">
          <div className="p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
                <TrendingUp className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Community
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Discover &amp; support causes
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Explore organizations making an impact in your community and beyond.
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-emerald-600 hover:to-teal-600"
            >
              Explore organizations
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Brand footer */}
        <div className="flex items-center justify-center gap-2 px-2 py-1">
          <BrandMark className="h-5 w-5 opacity-40" id="feed-sidebar" />
          <span className="text-[11px] text-slate-300 font-medium">&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </aside>
  );
}
