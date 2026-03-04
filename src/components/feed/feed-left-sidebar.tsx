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
} from "lucide-react";
import { useUser } from "@/lib/use-user";
import { BrandMark } from "@/components/brand-mark";

/* Uses feed theme CSS variables so sidebar matches light feed */

const NAV_ITEMS = [
  { href: "/feed",                      label: "Feed",        icon: LayoutGrid    },
  { href: "/explore",                   label: "Explore",     icon: Compass       },
  { href: "/dashboard/connections",     label: "Peers",       icon: Users         },
  { href: "/dashboard/my-donations",    label: "Donations",   icon: CreditCard    },
  { href: "/dashboard",                 label: "Dashboard",   icon: Heart         },
  { href: "/messages",                  label: "Messages",    icon: MessageSquare },
  { href: "/dashboard/settings",        label: "Settings",    icon: Settings      },
];

export function FeedLeftSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

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
      <div className="sticky top-[4.5rem] space-y-2">

        {/* ── User card ── */}
        <div
          className="overflow-hidden rounded-2xl ft-card"
          style={{ border: "1px solid var(--feed-border)" }}
        >
          <div className="p-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-10 w-10 overflow-hidden rounded-full" style={{ boxShadow: "0 0 0 2px var(--feed-card), 0 0 0 3.5px var(--feed-accent)" }}>
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" fill className="object-cover" sizes="40px" />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-sm font-bold text-white"
                      style={{ background: "var(--feed-gradient)" }}
                    >
                      {initial}
                    </div>
                  )}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
                  style={{ background: "#22c55e", borderColor: "var(--feed-card)" }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold ft-text">{displayName}</p>
                <p className="truncate text-xs ft-text-muted">{user?.email?.split("@")[0] ?? "Community member"}</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl p-2 ft-input-bg">
              {[
                { label: "Posts", value: "—" },
                { label: "Follow", value: "—" },
                { label: "Impact", value: "—" },
              ].map((s) => (
                <div key={s.label} className="py-1 text-center">
                  <div className="text-xs font-bold ft-accent">{s.value}</div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider ft-text-dim">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav
          className="overflow-hidden rounded-2xl ft-card"
          style={{ border: "1px solid var(--feed-border)" }}
        >
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider ft-text-muted">
            Navigation
          </p>
          <div className="pb-2">
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
                  className="group relative flex w-full items-center gap-3 px-4 py-2.5 transition-colors duration-150"
                  style={
                    isActive
                      ? { background: "var(--feed-nav-active-bg)", color: "var(--feed-nav-active-text)" }
                      : { color: "var(--feed-text)" }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "var(--feed-card-hover)";
                      (e.currentTarget as HTMLElement).style.opacity = "0.9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                    }
                  }}
                >
                  <Icon
                    className="h-5 w-5 shrink-0"
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ color: isActive ? "var(--feed-accent)" : "var(--feed-text)" }}
                  />
                  <span className="text-[13.5px]">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Discover CTA ── */}
        <div
          className="overflow-hidden rounded-2xl ft-card"
          style={{ border: "1px solid var(--feed-border)" }}
        >
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg ft-badge">
                <TrendingUp className="h-3.5 w-3.5 ft-accent" strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider ft-text-dim">
                Discover
              </span>
            </div>
            <p className="text-sm font-semibold ft-text">Find organizations</p>
            <p className="mt-0.5 text-xs leading-relaxed ft-text-muted">
              Support causes making a difference in your community.
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ft-badge"
            >
              Explore now
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Branding */}
        <div className="flex items-center gap-2 px-2 pb-2">
          <span style={{ opacity: 0.5 }}>
            <BrandMark variant="feed" className="[&_.brand-mark-exchange]:!text-[10px] [&_svg]:!h-4 [&_svg]:!w-4" id="feed-sidebar-brand" />
          </span>
          <span className="text-[9px] font-medium ft-text-dim">
            &copy; {new Date().getFullYear()} The Exchange
          </span>
        </div>
      </div>
    </aside>
  );
}
