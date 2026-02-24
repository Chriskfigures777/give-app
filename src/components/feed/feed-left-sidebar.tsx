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
  Palette,
} from "lucide-react";
import { useUser } from "@/lib/use-user";
import { BrandMark } from "@/components/brand-mark";
import { useFeedTheme, FEED_THEMES } from "./feed-theme-context";

const NAV_ITEMS = [
  { href: "/feed",                      label: "Feed",        icon: LayoutGrid  },
  { href: "/explore",                   label: "Explore",     icon: Compass     },
  { href: "/dashboard/connections",     label: "Peers",       icon: Users       },
  { href: "/dashboard/my-donations",    label: "Donations",   icon: CreditCard  },
  { href: "/dashboard",                 label: "Dashboard",   icon: Heart       },
  { href: "/messages",                  label: "Messages",    icon: MessageSquare },
  { href: "/dashboard/settings",        label: "Settings",    icon: Settings    },
];

export function FeedLeftSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { theme, setTheme, themeDef } = useFeedTheme();

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

  const isLight = theme === "pearl";

  return (
    <aside className="hidden w-[240px] shrink-0 xl:block">
      {/* Sticky container */}
      <div className="sticky top-[4.5rem] space-y-3">

        {/* ── User card with gradient border ── */}
        <div
          className="ft-gradient-border rounded-2xl overflow-hidden ft-card-shadow"
          style={{ border: "1px solid var(--feed-border)" }}
        >
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--feed-card)" }}
          >
            <div className="flex items-center gap-3">
              {/* Avatar with glow ring */}
              <div className="relative shrink-0">
                <div
                  className="h-11 w-11 rounded-full overflow-hidden"
                  style={{
                    boxShadow: `0 0 0 2px var(--feed-bg), 0 0 0 4px var(--feed-border-strong)`,
                  }}
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: "var(--feed-gradient)",
                        color: "#fff",
                      }}
                    >
                      {initial}
                    </div>
                  )}
                </div>
                {/* Online dot */}
                <span
                  className="online-dot absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2"
                  style={{
                    background: "#22c55e",
                    borderColor: "var(--feed-bg)",
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-semibold"
                  style={{ color: "var(--feed-text)" }}
                >
                  {displayName}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--feed-text-muted)" }}
                >
                  {user?.email?.split("@")[0] ?? "Community member"}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div
              className="mt-3 grid grid-cols-3 gap-1 rounded-xl p-2"
              style={{ background: "var(--feed-input-bg)" }}
            >
              {[
                { label: "Posts", value: "—" },
                { label: "Follow", value: "—" },
                { label: "Impact", value: "—" },
              ].map((s) => (
                <div key={s.label} className="text-center py-1">
                  <div
                    className="text-xs font-bold"
                    style={{ color: "var(--feed-accent)" }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-[9px] font-medium uppercase tracking-wider mt-0.5"
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
          className="rounded-2xl overflow-hidden ft-card-shadow"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border)",
          }}
        >
          <div className="p-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/feed" && pathname?.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative"
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
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--feed-text)";
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--feed-input-bg)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--feed-text-muted)";
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }
                  }}
                >
                  {/* Active left indicator */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full"
                      style={{ background: "var(--feed-gradient)" }}
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Discover CTA ── */}
        <div
          className="rounded-2xl overflow-hidden ft-card-shadow"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border)",
          }}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--feed-badge-bg)" }}
              >
                <TrendingUp
                  className="h-3.5 w-3.5"
                  style={{ color: "var(--feed-accent)" }}
                  strokeWidth={2.5}
                />
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--feed-text-dim)" }}
              >
                Discover
              </span>
            </div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--feed-text)" }}
            >
              Find organizations
            </p>
            <p
              className="mt-0.5 text-xs leading-relaxed"
              style={{ color: "var(--feed-text-muted)" }}
            >
              Support causes making a difference in your community.
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200"
              style={{
                background: "var(--feed-badge-bg)",
                color: "var(--feed-badge-text)",
              }}
            >
              Explore now
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Theme Picker ── */}
        <div
          className="rounded-2xl overflow-hidden ft-card-shadow"
          style={{
            background: "var(--feed-card)",
            border: "1px solid var(--feed-border)",
          }}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette
                className="h-3.5 w-3.5"
                style={{ color: "var(--feed-text-dim)" }}
                strokeWidth={2}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--feed-text-dim)" }}
              >
                Theme
              </span>
              <span
                className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md ft-badge"
              >
                {themeDef.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {FEED_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  title={`${t.label} — ${t.description}`}
                  onClick={() => setTheme(t.id)}
                  className={`ft-swatch ${theme === t.id ? "active" : ""}`}
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${t.accent}, ${t.bg})`,
                    border: `1.5px solid ${t.accent}33`,
                    // @ts-ignore
                    "--ft-swatch-accent": t.accent,
                  } as React.CSSProperties}
                  aria-label={`Switch to ${t.label} theme`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="flex items-center gap-2 px-2 pb-2">
          <span style={{ opacity: 0.3 }}>
            <BrandMark className="h-3.5 w-3.5" id="feed-sidebar-brand" />
          </span>
          <span
            className="text-[9px] font-medium"
            style={{ color: "var(--feed-text-dim)" }}
          >
            &copy; {new Date().getFullYear()} Give
          </span>
        </div>
      </div>
    </aside>
  );
}
