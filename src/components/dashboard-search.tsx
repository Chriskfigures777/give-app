"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  LayoutDashboard,
  Heart,
  Wallet,
  Settings,
  Palette,
  Receipt,
  Calendar,
  Users,
  Target,
  Layout,
  FileText,
  CreditCard,
  Church,
  ArrowRight,
  Loader2,
  Code2,
} from "lucide-react";

type DashboardPage = {
  label: string;
  href: string;
  keywords: string;
  icon: React.ReactNode;
};

const DASHBOARD_PAGES: DashboardPage[] = [
  { label: "Overview", href: "/dashboard", keywords: "home overview dashboard main", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My gifts", href: "/dashboard/my-donations", keywords: "my gifts donations giving history", icon: <Heart className="h-4 w-4" /> },
  { label: "Donations", href: "/dashboard/donations", keywords: "donations received incoming payments", icon: <Wallet className="h-4 w-4" /> },
  { label: "Events", href: "/dashboard/events", keywords: "events calendar fundraising", icon: <Calendar className="h-4 w-4" /> },
  { label: "Goals", href: "/dashboard/goals", keywords: "goals targets campaigns fundraising", icon: <Target className="h-4 w-4" /> },
  { label: "Givers", href: "/dashboard/givers", keywords: "givers donors supporters people", icon: <Users className="h-4 w-4" /> },
  { label: "Public page", href: "/dashboard/profile", keywords: "public page profile organization info", icon: <FileText className="h-4 w-4" /> },
  { label: "Website builder", href: "/dashboard/pages", keywords: "website builder pages site design", icon: <Layout className="h-4 w-4" /> },
  { label: "Website form", href: "/dashboard/website-form", keywords: "website form form design donation form customization branding colors logo", icon: <Palette className="h-4 w-4" /> },
  { label: "Custom forms", href: "/dashboard/custom-forms", keywords: "custom forms embed forms donation form embed webflow wordpress", icon: <Code2 className="h-4 w-4" /> },
  { label: "Settings", href: "/dashboard/settings", keywords: "settings preferences configuration domain", icon: <Settings className="h-4 w-4" /> },
  { label: "Plan & billing", href: "/dashboard/billing", keywords: "plan billing subscription pricing upgrade", icon: <Receipt className="h-4 w-4" /> },
  { label: "Payout account", href: "/dashboard/connect/verify", keywords: "payout account verification stripe connect bank", icon: <CreditCard className="h-4 w-4" /> },
];

type OrgResult = {
  id: string;
  name: string;
  slug: string;
  org_type: string | null;
  city: string | null;
  state: string | null;
};

type EventResult = {
  id: string;
  name: string;
  slug: string;
  start_at: string;
  org: { name: string; slug: string } | null;
};

const DEBOUNCE_MS = 300;

export function DashboardSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<OrgResult[]>([]);
  const [events, setEvents] = useState<EventResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();

  const filteredPages = q
    ? DASHBOARD_PAGES.filter(
        (p) => p.label.toLowerCase().includes(q) || p.keywords.includes(q)
      )
    : DASHBOARD_PAGES.slice(0, 6);

  const allItems: Array<
    | { type: "page"; data: DashboardPage }
    | { type: "org"; data: OrgResult }
    | { type: "event"; data: EventResult }
  > = [
    ...filteredPages.map((p) => ({ type: "page" as const, data: p })),
    ...orgs.map((o) => ({ type: "org" as const, data: o })),
    ...events.map((e) => ({ type: "event" as const, data: e })),
  ];

  const runSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setOrgs([]);
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: term, type: "all", limit: "5" });
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setOrgs(data.organizations ?? []);
      setEvents(data.events ?? []);
    } catch {
      setOrgs([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setOrgs([]);
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => runSearch(query.trim()), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const openSearch = useCallback(() => {
    setOpen(true);
    setQuery("");
    setOrgs([]);
    setEvents([]);
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const selectItem = useCallback(
    (item: (typeof allItems)[number]) => {
      closeSearch();
      if (item.type === "page") router.push(item.data.href);
      else if (item.type === "org") router.push(`/org/${item.data.slug}`);
      else router.push(`/events/${item.data.id}`);
    },
    [closeSearch, router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        openSearch();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) closeSearch();
        else openSearch();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, openSearch, closeSearch]);

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[activeIndex]) {
      e.preventDefault();
      selectItem(allItems[activeIndex]);
    } else if (e.key === "Escape") {
      closeSearch();
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <>
      {/* Trigger button in the nav bar */}
      <button
        type="button"
        onClick={openSearch}
        className="group flex items-center gap-2.5 rounded-xl border border-dashboard-border/60 bg-dashboard-card/60 px-3.5 py-2 text-sm text-dashboard-text-muted transition-all duration-200 hover:border-emerald-300/60 hover:bg-dashboard-card-hover hover:text-dashboard-text hover:shadow-sm dark:hover:border-emerald-600/40"
      >
        <Search className="h-3.5 w-3.5 shrink-0 transition-colors group-hover:text-emerald-500" />
        <span className="text-xs">Search...</span>
        <kbd className="ml-3 hidden rounded-md border border-dashboard-border bg-dashboard-card px-1.5 py-0.5 text-[10px] font-medium text-dashboard-text-muted sm:inline-block">
          /
        </kbd>
      </button>

      {/* Modal overlay */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh] sm:pt-[16vh]"
                onClick={(e) => {
                  if (e.target === e.currentTarget) closeSearch();
                }}
              >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                {/* Search panel */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="relative w-full max-w-lg mx-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-900"
                >
                  {/* Search input */}
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
                    <Search className="h-[18px] w-[18px] shrink-0 text-slate-400 dark:text-slate-500" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyNavigation}
                      placeholder="Search pages, organizations, events..."
                      className="flex-1 bg-transparent py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {loading && (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                    )}
                    <button
                      type="button"
                      onClick={closeSearch}
                      className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Results */}
                  <div
                    ref={listRef}
                    className="max-h-[min(360px,50vh)] overflow-y-auto overscroll-contain py-2"
                  >
                    {/* Dashboard pages */}
                    {filteredPages.length > 0 && (
                      <div className="px-2 pb-1">
                        <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          {q ? "Pages" : "Quick navigation"}
                        </p>
                        {filteredPages.map((page, i) => {
                          const globalIdx = i;
                          return (
                            <button
                              key={page.href}
                              type="button"
                              data-index={globalIdx}
                              onClick={() => selectItem({ type: "page", data: page })}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                activeIndex === globalIdx
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                  activeIndex === globalIdx
                                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {page.icon}
                              </span>
                              <span className="flex-1 font-medium">{page.label}</span>
                              <ArrowRight
                                className={`h-3.5 w-3.5 transition-opacity ${
                                  activeIndex === globalIdx ? "opacity-100" : "opacity-0"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Organizations */}
                    {orgs.length > 0 && (
                      <div className="border-t border-slate-100 px-2 pt-1 dark:border-slate-800">
                        <p className="px-2 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Organizations
                        </p>
                        {orgs.map((org, i) => {
                          const globalIdx = filteredPages.length + i;
                          return (
                            <button
                              key={org.id}
                              type="button"
                              data-index={globalIdx}
                              onClick={() => selectItem({ type: "org", data: org })}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                activeIndex === globalIdx
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  activeIndex === globalIdx
                                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                                    : "bg-slate-100 dark:bg-slate-800"
                                }`}
                              >
                                {org.org_type === "church" ? (
                                  <Church className="h-4 w-4 text-amber-600" />
                                ) : (
                                  <Heart className="h-4 w-4 text-sky-600" />
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{org.name}</p>
                                {org.city && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {org.city}, {org.state}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  org.org_type === "church"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                                }`}
                              >
                                {org.org_type === "church" ? "Church" : org.org_type === "missionary" ? "Missionary" : "Nonprofit"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Events */}
                    {events.length > 0 && (
                      <div className="border-t border-slate-100 px-2 pt-1 dark:border-slate-800">
                        <p className="px-2 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Events
                        </p>
                        {events.map((ev, i) => {
                          const globalIdx = filteredPages.length + orgs.length + i;
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              data-index={globalIdx}
                              onClick={() => selectItem({ type: "event", data: ev })}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                activeIndex === globalIdx
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  activeIndex === globalIdx
                                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                                    : "bg-violet-100 dark:bg-violet-900/30"
                                }`}
                              >
                                <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{ev.name}</p>
                                {ev.org && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {ev.org.name}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                                {new Date(ev.start_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* No results */}
                    {q.length >= 2 &&
                      !loading &&
                      filteredPages.length === 0 &&
                      orgs.length === 0 &&
                      events.length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <Search className="mx-auto h-8 w-8 text-slate-200 dark:text-slate-700" />
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            No results for &ldquo;{query}&rdquo;
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            Try a different search term
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono dark:border-slate-700 dark:bg-slate-800">
                          &uarr;&darr;
                        </kbd>
                        navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono dark:border-slate-700 dark:bg-slate-800">
                          &crarr;
                        </kbd>
                        select
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono dark:border-slate-700 dark:bg-slate-800">
                          esc
                        </kbd>
                        close
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
