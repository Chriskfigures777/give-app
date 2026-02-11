"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NavSearch } from "./nav-search";
import { useUser } from "@/lib/use-user";

const MAIN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/mission", label: "Mission" },
  { href: "/about", label: "About" },
];

function getUserDisplay(user: { user_metadata?: Record<string, unknown>; email?: string | null }) {
  const name =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    user.email?.split("@")[0] ??
    "?";
  const initial = name.charAt(0).toUpperCase();
  const avatarUrl = (user.user_metadata?.avatar_url as string) ?? (user.user_metadata?.picture as string);
  return { name, initial, avatarUrl };
}

export function SiteNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // Close desktop user menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handle = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [userMenuOpen]);

  // Close mobile user menu when clicking outside
  useEffect(() => {
    if (!mobileUserMenuOpen) return;
    const handle = (e: MouseEvent) => {
      if (mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(e.target as Node)) {
        setMobileUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [mobileUserMenuOpen]);

  // Hide nav on dashboard (dashboard has its own layout)
  if (pathname?.startsWith("/dashboard")) return null;

  // When on give/[slug], pass org slug so login saves it to donor profile
  const giveMatch = pathname?.match(/^\/give\/([^/]+)$/);
  const orgSlugForLogin = giveMatch?.[1] ?? null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/98 shadow-sm backdrop-blur-lg">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-slate-900 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-lg"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-bold text-white shadow-md">
            G
          </span>
          <span className="text-xl tracking-tight">Give</span>
        </Link>

        {/* Desktop nav — always show all links including Home */}
        <nav className="hidden items-center gap-2 md:flex" aria-label="Main">
          {MAIN_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition shrink-0
                  ${isActive
                    ? "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/60"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop search */}
        <div className="hidden flex-1 justify-center px-4 md:flex lg:px-6">
          <NavSearch />
        </div>

        {/* Desktop auth: user menu when logged in, else Log in / Sign up */}
        <div className="hidden items-center gap-2 md:flex" ref={userMenuRef}>
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-slate-700 font-semibold transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 overflow-hidden"
                aria-label="Account menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {getUserDisplay(user).avatarUrl ? (
                  <img
                    src={getUserDisplay(user).avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getUserDisplay(user).initial}</span>
                )}
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  role="menu"
                >
                  <div className="border-b border-slate-100 px-4 py-2.5">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {getUserDisplay(user).name}
                    </p>
                    {user.email && (
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    )}
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                  >
                    Settings
                  </Link>
                  <form action="/api/auth/signout" method="POST" className="border-t border-slate-100">
                    <button
                      type="submit"
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href={orgSlugForLogin ? `/login?org=${encodeURIComponent(orgSlugForLogin)}` : "/login"}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile: user avatar when logged in, else Log in / Sign up; plus menu button */}
        <div className="relative flex items-center gap-2 md:hidden" ref={mobileUserMenuRef}>
          {user ? (
            <>
              <button
                type="button"
                onClick={() => setMobileUserMenuOpen((o) => !o)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-slate-700 font-semibold overflow-hidden"
                aria-label="Account menu"
                aria-expanded={mobileUserMenuOpen}
              >
                {getUserDisplay(user).avatarUrl ? (
                  <img
                    src={getUserDisplay(user).avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getUserDisplay(user).initial}</span>
                )}
              </button>
              {mobileUserMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-2.5">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {getUserDisplay(user).name}
                    </p>
                    {user.email && (
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    )}
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Settings
                  </Link>
                  <form action="/api/auth/signout" method="POST" className="border-t border-slate-100">
                    <button
                      type="submit"
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                href={orgSlugForLogin ? `/login?org=${encodeURIComponent(orgSlugForLogin)}` : "/login"}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Sign up
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2.5 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu — always include Home; when logged in add Dashboard, Settings, Sign out */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="mb-4">
            <NavSearch onNavigate={() => setMobileOpen(false)} />
          </div>
          <nav className="flex flex-col gap-2" aria-label="Main mobile">
            {MAIN_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {user && (
              <>
                <div className="my-2 border-t border-slate-200 pt-2">
                  <p className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Your account
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Settings
                </Link>
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </form>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
