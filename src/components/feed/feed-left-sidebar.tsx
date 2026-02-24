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
  { href: "/feed", label: "Feed", icon: LayoutGrid },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/dashboard/connections", label: "Peers", icon: Users },
  { href: "/dashboard/my-donations", label: "My Donations", icon: CreditCard },
  { href: "/dashboard", label: "Dashboard", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function FeedLeftSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const name = (user?.user_metadata?.full_name as string) ?? (user?.user_metadata?.name as string) ?? user?.email?.split("@")[0] ?? "there";
  const displayName = name.split(" ")[0];
  const avatarUrl = (user?.user_metadata?.avatar_url as string) ?? (user?.user_metadata?.picture as string) ?? null;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="hidden w-[240px] shrink-0 xl:block">
      <div className="space-y-6">
        {/* User card — minimal */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill className="object-cover" sizes="40px" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">{initial}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">Hi, {displayName}</p>
              <p className="text-xs text-slate-500">Your feed</p>
            </div>
          </div>
        </div>

        {/* Nav — rail style */}
        <nav className="rounded-xl border border-slate-200 bg-white p-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Discover</span>
          </div>
          <p className="text-sm font-medium text-slate-900">Find organizations</p>
          <p className="mt-0.5 text-xs text-slate-500">Support causes in your community.</p>
          <Link
            href="/explore"
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Explore <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2 px-1">
          <BrandMark className="h-4 w-4 opacity-50" id="feed-sidebar" />
          <span className="text-[10px] text-slate-400">&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </aside>
  );
}
