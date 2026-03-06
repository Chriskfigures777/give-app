"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useUser } from "@/lib/use-user";
import { BrandMark } from "@/components/brand-mark";

const NAV_ITEMS = [
  { href: "/feed",                   label: "Feed",      icon: LayoutGrid    },
  { href: "/explore",                label: "Explore",   icon: Compass       },
  { href: "/dashboard/connections",  label: "Peers",     icon: Users         },
  { href: "/dashboard/my-donations", label: "Donations", icon: CreditCard    },
  { href: "/dashboard",              label: "Dashboard", icon: Heart         },
  { href: "/messages",               label: "Messages",  icon: MessageSquare },
  { href: "/dashboard/settings",     label: "Settings",  icon: Settings      },
];

type UserStats = { postCount: number; connectionCount: number; donationTotalCents: number };

export function FeedLeftSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetch("/api/me?stats=1")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.postCount === "number") {
          setStats({
            postCount: d.postCount,
            connectionCount: d.connectionCount ?? 0,
            donationTotalCents: d.donationTotalCents ?? 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const name =
    (user?.user_metadata?.full_name as string) ??
    (user?.user_metadata?.name as string) ??
    user?.email?.split("@")[0] ??
    "there";
  const displayName = name.split(" ")[0];
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string) ??
    (user?.user_metadata?.picture as string) ??
    null;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="hidden w-[240px] shrink-0 xl:block">
      <div className="sticky top-[4.5rem] space-y-2.5">

        {/* ── User card ── */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border-strong)",
            boxShadow: "var(--feed-card-shadow)",
          }}
        >
          {/* Top gradient accent stripe */}
          <div
            className="h-1 w-full"
            style={{ background: "var(--feed-gradient)" }}
          />
          <div className="p-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-white"
                  style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.08)" }}
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" fill className="object-cover" sizes="44px" />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-sm font-bold text-white"
                      style={{ background: "var(--feed-gradient)" }}
                    >
                      {initial}
                    </div>
                  )}
                </div>
                {/* Online dot */}
                <span
                  className="online-dot absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
                  style={{ background: "#22c55e" }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold" style={{ color: "var(--feed-text)" }}>
                  {displayName}
                </p>
                <p className="truncate text-[11px]" style={{ color: "var(--feed-text-muted)" }}>
                  {user?.email?.split("@")[0] ?? "Community member"}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div
              className="mt-3 grid grid-cols-3 divide-x rounded-xl overflow-hidden"
              style={{
                background: "var(--feed-input-bg)",
                border: "1px solid var(--feed-border-strong)",
              }}
            >
              {[
                { label: "Posts",  value: stats ? String(stats.postCount) : "—" },
                { label: "Peers",  value: stats ? String(stats.connectionCount) : "—" },
                { label: "Impact", value: stats ? (stats.donationTotalCents >= 100 ? `$${Math.floor(stats.donationTotalCents / 100)}` : "$0") : "—" },
              ].map((s) => (
                <div key={s.label} className="py-2.5 text-center">
                  <div
                    className="text-xs font-extrabold"
                    style={{ color: "var(--feed-accent-dark)" }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="mt-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--feed-text-dim)" }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav
          className="overflow-hidden rounded-2xl"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border-strong)",
            boxShadow: "var(--feed-card-shadow)",
          }}
        >
          <p
            className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--feed-text-dim)" }}
          >
            Navigation
          </p>
          <div className="px-2 pb-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/feed" && pathname?.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-150"
                  style={
                    isActive
                      ? {
                          background: "var(--feed-nav-active-bg)",
                          color: "var(--feed-nav-active-text)",
                        }
                      : { color: "var(--feed-text-muted)" }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "var(--feed-input-bg)";
                      (e.currentTarget as HTMLElement).style.color = "var(--feed-text)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--feed-text-muted)";
                    }
                  }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
                    style={{
                      background: isActive ? "rgba(52,211,153,0.15)" : "var(--feed-input-bg)",
                    }}
                  >
                    <Icon
                      className="h-[15px] w-[15px]"
                      strokeWidth={isActive ? 2.5 : 2}
                      style={{ color: isActive ? "var(--feed-accent-dark)" : "var(--feed-text-muted)" }}
                    />
                  </span>
                  <span className="text-[13px] font-semibold">{item.label}</span>
                  {isActive && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--feed-accent-dark)" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Discover CTA ── */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border-strong)",
            boxShadow: "var(--feed-card-shadow)",
          }}
        >
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "rgba(5,150,105,0.1)" }}
              >
                <TrendingUp className="h-3.5 w-3.5" style={{ color: "#059669" }} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--feed-text-dim)" }}>
                Discover
              </span>
            </div>
            <p className="text-[13.5px] font-bold" style={{ color: "var(--feed-text)" }}>
              Find organizations
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: "var(--feed-text-muted)" }}>
              Support causes making a difference in your community.
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200"
              style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(5,150,105,0.16)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(5,150,105,0.1)"; }}
            >
              Explore now
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Branding */}
        <div className="flex items-center gap-2 px-2 pb-1">
          <span style={{ opacity: 0.45 }}>
            <BrandMark
              variant="feed"
              className="[&_.brand-mark-exchange]:!text-[10px] [&_svg]:!h-4 [&_svg]:!w-4"
              id="feed-sidebar-brand"
            />
          </span>
          <span className="text-[9px] font-medium" style={{ color: "var(--feed-text-dim)" }}>
            &copy; {new Date().getFullYear()} The Exchange
          </span>
        </div>
      </div>
    </aside>
  );
}
