"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Bell,
  Home,
  LayoutGrid,
  Handshake,
  Compass,
  ChevronRight,
  LogOut,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { useUser } from "@/lib/use-user";
import { useMe } from "@/lib/use-me";
import { usePricingModal } from "@/lib/use-pricing-modal";
import { BrandMark } from "./brand-mark";
import { NavNotificationsDropdown } from "./nav-notifications-dropdown";
import { NavConnectionRequestsDropdown } from "./nav-connection-requests-dropdown";

const MAIN_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/pricing", label: "Pricing" },
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

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, type: "spring" as const, stiffness: 300, damping: 24 },
  }),
};

function NavIconButton({
  href,
  isActive,
  title,
  ariaLabel,
  children,
  onClick,
}: {
  href?: string;
  isActive?: boolean;
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const classes = `relative shrink-0 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
    isActive
      ? "bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.35)]"
      : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800 hover:shadow-sm"
  }`;

  if (href) {
    return (
      <Link href={href} className={classes} title={title} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes} title={title} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [connectionRequestsOpen, setConnectionRequestsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);
  const notificationsAnchorRef = useRef<HTMLButtonElement>(null);
  const connectionRequestsAnchorRef = useRef<HTMLButtonElement>(null);
  const mobileConnectionRequestsAnchorRef = useRef<HTMLButtonElement | null>(null);
  const mobileNotificationsAnchorRef = useRef<HTMLButtonElement | null>(null);
  const { user } = useUser();
  const { me, setUnreadNotificationsCount, setPendingConnectionRequestsCount } = useMe();
  const { openPricingModal } = usePricingModal();
  const orgId = me?.orgId ?? null;
  const orgSlug = me?.orgSlug ?? null;
  const [scrolled, setScrolled] = useState(false);

  const unreadCount = me?.unreadNotificationsCount ?? 0;
  const connectionRequestCount = me?.pendingConnectionRequestsCount ?? 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  if (pathname?.startsWith("/dashboard")) return null;

  const giveMatch = pathname?.match(/^\/give\/([^/]+)$/);
  const orgMatch = pathname?.match(/^\/org\/([^/]+)$/);
  const orgSlugForLogin = giveMatch?.[1] ?? orgMatch?.[1] ?? null;

  const userDisplay = user ? getUserDisplay(user) : null;

  const USER_MENU_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "border-b border-slate-200/50 bg-white/85 shadow-[0_1px_40px_rgba(0,0,0,0.04)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/70"
          : "border-b border-slate-200/30 bg-white/70 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center rounded-xl transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <BrandMark
            className="h-9 w-9 transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_8px_12px_rgba(16,185,129,0.25)]"
            id="nav"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1.5 md:flex" ref={userMenuRef}>
          <nav className="flex items-center gap-1" aria-label="Main">
            <NavIconButton
              href={user && orgSlug ? `/org/${orgSlug}` : "/"}
              isActive={user && orgSlug ? pathname === `/org/${orgSlug}` : pathname === "/"}
              title="Home"
              ariaLabel="Home"
            >
              <Home className="h-[18px] w-[18px]" aria-hidden />
            </NavIconButton>

            {user && (
              <NavIconButton href="/feed" isActive={pathname === "/feed"} title="Feed" ariaLabel="Feed">
                <LayoutGrid className="h-[18px] w-[18px]" aria-hidden />
              </NavIconButton>
            )}

            {user && (
              <NavIconButton href="/explore" isActive={pathname === "/explore"} title="Explore" ariaLabel="Explore">
                <Compass className="h-[18px] w-[18px]" aria-hidden />
              </NavIconButton>
            )}

            {!user &&
              MAIN_LINKS.map((link) => {
                const isActive = pathname === link.href;
                if (link.href === "/pricing") {
                  return (
                    <button
                      key={link.href}
                      type="button"
                      onClick={openPricingModal}
                      className={`nav-underline shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "text-emerald-700"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {link.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-underline shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "text-emerald-700"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
          </nav>

          {user ? (
            <div className="ml-2 flex items-center gap-1.5 border-l border-slate-200/60 pl-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  ref={notificationsAnchorRef}
                  onClick={() => {
                    setNotificationsOpen((o) => !o);
                    setConnectionRequestsOpen(false);
                    setUserMenuOpen(false);
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                    notificationsOpen
                      ? "bg-slate-100 text-slate-900 shadow-sm"
                      : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800"
                  }`}
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                >
                  <Bell className="h-[18px] w-[18px]" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring" as const, stiffness: 500, damping: 25 }}
                        className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30 ring-2 ring-white"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <NavNotificationsDropdown
                  open={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                  anchorRef={notificationsAnchorRef}
                  unreadCount={unreadCount}
                  onUnreadChange={setUnreadNotificationsCount}
                  userId={user?.id}
                />
              </div>

              {/* Connection Requests */}
              <div className="relative">
                <button
                  type="button"
                  ref={connectionRequestsAnchorRef}
                  onClick={() => {
                    setConnectionRequestsOpen((o) => !o);
                    setNotificationsOpen(false);
                    setUserMenuOpen(false);
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                    connectionRequestsOpen
                      ? "bg-slate-100 text-slate-900 shadow-sm"
                      : connectionRequestCount > 0
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100/80"
                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800"
                  }`}
                  aria-label="Peers"
                  aria-expanded={connectionRequestsOpen}
                >
                  <Handshake className="h-[18px] w-[18px]" />
                  <AnimatePresence>
                    {connectionRequestCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring" as const, stiffness: 500, damping: 25 }}
                        className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30 ring-2 ring-white"
                      >
                        {connectionRequestCount > 9 ? "9+" : connectionRequestCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <NavConnectionRequestsDropdown
                  open={connectionRequestsOpen}
                  onClose={() => setConnectionRequestsOpen(false)}
                  anchorRef={connectionRequestsAnchorRef}
                  onCountChange={setPendingConnectionRequestsCount}
                />
              </div>

              {/* Messages */}
              {orgId && (
                <NavIconButton
                  href="/messages"
                  isActive={pathname === "/messages"}
                  title="Messages"
                  ariaLabel="Messages"
                >
                  <MessageSquare className="h-[18px] w-[18px]" />
                </NavIconButton>
              )}

              {/* User avatar + menu */}
              <div className="relative ml-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen((o) => !o);
                    setNotificationsOpen(false);
                    setConnectionRequestsOpen(false);
                  }}
                  className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-semibold overflow-hidden transition-all duration-200 ${
                    userMenuOpen
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                      : "border-slate-200/80 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800"
                  }`}
                  aria-label="Account menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  {userDisplay?.avatarUrl ? (
                    <img src={userDisplay.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{userDisplay?.initial}</span>
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 top-full z-50 mt-2.5 w-60 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
                      role="menu"
                    >
                      <div className="border-b border-slate-100/80 px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm overflow-hidden">
                            {userDisplay?.avatarUrl ? (
                              <img src={userDisplay.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span>{userDisplay?.initial}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {userDisplay?.name}
                            </p>
                            {user.email && (
                              <p className="truncate text-xs text-slate-400">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="py-1.5">
                        {USER_MENU_ITEMS.map((item, i) => (
                          <motion.div
                            key={item.href}
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                          >
                            <Link
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition-all duration-150 hover:bg-slate-50/80 hover:text-slate-900"
                              role="menuitem"
                            >
                              <item.icon className="h-4 w-4 text-slate-400 transition-colors group-hover/item:text-emerald-500" />
                              <span className="flex-1 font-medium">{item.label}</span>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-300 opacity-0 transition-all duration-150 group-hover/item:opacity-100 group-hover/item:translate-x-0.5" />
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                      <motion.div
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={USER_MENU_ITEMS.length}
                        className="border-t border-slate-100/80"
                      >
                        <form action="/api/auth/signout" method="POST">
                          <button
                            type="submit"
                            className="group/item flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-rose-50/60 hover:text-rose-700"
                            role="menuitem"
                          >
                            <LogOut className="h-4 w-4 text-slate-400 transition-colors group-hover/item:text-rose-500" />
                            <span>Sign out</span>
                          </button>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href={orgSlugForLogin ? `/login?org=${encodeURIComponent(orgSlugForLogin)}` : "/login"}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="glow-btn relative rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile right section */}
        <div className="relative flex items-center gap-1.5 md:hidden" ref={mobileUserMenuRef}>
          {user && (
            <>
              {/* Mobile Notifications */}
              <div className="relative">
                <button
                  type="button"
                  ref={mobileNotificationsAnchorRef}
                  onClick={() => {
                    setNotificationsOpen((o) => !o);
                    setConnectionRequestsOpen(false);
                  }}
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100/80 transition-all duration-200"
                  aria-label="Notifications"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring" as const, stiffness: 500, damping: 25 }}
                        className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <div className="md:hidden">
                  <NavNotificationsDropdown
                    open={notificationsOpen}
                    onClose={() => setNotificationsOpen(false)}
                    anchorRef={mobileNotificationsAnchorRef}
                    unreadCount={unreadCount}
                    onUnreadChange={setUnreadNotificationsCount}
                    userId={user?.id}
                  />
                </div>
              </div>
              {/* Mobile Connection Requests */}
              <div className="relative">
                <button
                  type="button"
                  ref={mobileConnectionRequestsAnchorRef}
                  onClick={() => {
                    setConnectionRequestsOpen((o) => !o);
                    setNotificationsOpen(false);
                  }}
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                    connectionRequestCount > 0
                      ? "bg-rose-50 text-rose-600"
                      : "text-slate-500 hover:bg-slate-100/80"
                  }`}
                  aria-label="Connection requests"
                  title="Connection requests"
                >
                  <Handshake className="h-[18px] w-[18px]" />
                  <AnimatePresence>
                    {connectionRequestCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring" as const, stiffness: 500, damping: 25 }}
                        className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
                      >
                        {connectionRequestCount > 9 ? "9+" : connectionRequestCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <div className="md:hidden">
                  <NavConnectionRequestsDropdown
                    open={connectionRequestsOpen}
                    onClose={() => setConnectionRequestsOpen(false)}
                    anchorRef={mobileConnectionRequestsAnchorRef}
                    onCountChange={setPendingConnectionRequestsCount}
                  />
                </div>
              </div>
            </>
          )}

          {/* Mobile Messages */}
          {user && orgId && (
            <Link
              href="/messages"
              className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                pathname === "/messages"
                  ? "bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "text-slate-500 hover:bg-slate-100/80"
              }`}
              aria-label="Messages"
              title="Messages"
            >
              <MessageSquare className="h-[18px] w-[18px]" />
            </Link>
          )}

          {/* Mobile avatar + menu */}
          {user ? (
            <>
              <button
                type="button"
                onClick={() => setMobileUserMenuOpen((o) => !o)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-semibold overflow-hidden transition-all duration-200 ${
                  mobileUserMenuOpen
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200/80 bg-slate-50 hover:border-emerald-300"
                }`}
                aria-label="Account menu"
                aria-expanded={mobileUserMenuOpen}
              >
                {userDisplay?.avatarUrl ? (
                  <img src={userDisplay.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-slate-700">{userDisplay?.initial}</span>
                )}
              </button>
              <AnimatePresence>
                {mobileUserMenuOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-full z-50 mt-2.5 w-60 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
                  >
                    <div className="border-b border-slate-100/80 px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm overflow-hidden">
                          {userDisplay?.avatarUrl ? (
                            <img src={userDisplay.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span>{userDisplay?.initial}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {userDisplay?.name}
                          </p>
                          {user.email && (
                            <p className="truncate text-xs text-slate-400">{user.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="py-1.5">
                      {USER_MENU_ITEMS.map((item, i) => (
                        <motion.div
                          key={item.href}
                          variants={menuItemVariants}
                          initial="hidden"
                          animate="visible"
                          custom={i}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setMobileUserMenuOpen(false)}
                            className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition-all duration-150 hover:bg-slate-50/80 hover:text-slate-900"
                          >
                            <item.icon className="h-4 w-4 text-slate-400 transition-colors group-hover/item:text-emerald-500" />
                            <span className="flex-1 font-medium">{item.label}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-300 opacity-0 transition-all duration-150 group-hover/item:opacity-100" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                    <motion.div
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={USER_MENU_ITEMS.length}
                      className="border-t border-slate-100/80"
                    >
                      <form action="/api/auth/signout" method="POST">
                        <button
                          type="submit"
                          className="group/item flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-rose-50/60 hover:text-rose-700"
                        >
                          <LogOut className="h-4 w-4 text-slate-400 transition-colors group-hover/item:text-rose-500" />
                          <span>Sign out</span>
                        </button>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              <Link
                href={orgSlugForLogin ? `/login?org=${encodeURIComponent(orgSlugForLogin)}` : "/login"}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20"
              >
                Sign up
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100/80 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.svg
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-slate-200/40 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Main mobile">
              {[
                {
                  href: user && orgSlug ? `/org/${orgSlug}` : "/",
                  label: "Home",
                  icon: Home,
                  active: user && orgSlug ? pathname === `/org/${orgSlug}` : pathname === "/",
                },
                ...(user
                  ? [
                      { href: "/feed", label: "Feed", icon: LayoutGrid, active: pathname === "/feed" },
                      { href: "/explore", label: "Explore", icon: Compass, active: pathname === "/explore" },
                    ]
                  : []),
              ].map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, type: "spring" as const, stiffness: 300, damping: 24 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                      item.active
                        ? "bg-emerald-50/80 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {!user &&
                MAIN_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (i + 1) * 0.05, type: "spring" as const, stiffness: 300, damping: 24 }}
                  >
                    {link.href === "/pricing" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          openPricingModal();
                        }}
                        className={`rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 block w-full text-left ${
                          pathname === link.href
                            ? "bg-emerald-50/80 text-emerald-700"
                            : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
                        }`}
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 block ${
                          pathname === link.href
                            ? "bg-emerald-50/80 text-emerald-700"
                            : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
                        }`}
                      >
                        {link.label}
                      </Link>
                    )}
                  </motion.div>
                ))}

              {user && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="my-2 border-t border-slate-200/60 pt-2"
                  >
                    <p className="px-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Your account
                    </p>
                  </motion.div>
                  {USER_MENU_ITEMS.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05, type: "spring" as const, stiffness: 300, damping: 24 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 transition-all duration-150"
                      >
                        <item.icon className="h-4 w-4 text-slate-400" />
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring" as const, stiffness: 300, damping: 24 }}
                  >
                    <form action="/api/auth/signout" method="POST">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-rose-50/60 hover:text-rose-700 transition-all duration-150"
                      >
                        <LogOut className="h-4 w-4 text-slate-400" />
                        Sign out
                      </button>
                    </form>
                  </motion.div>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
