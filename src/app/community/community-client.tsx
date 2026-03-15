"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  UserPlus,
  Check,
  MapPin,
  ArrowUpRight,
  Users,
  Loader2,
  X,
  LayoutGrid,
  UserCircle2,
  Building2,
  Sparkles,
  Church,
  Heart,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { UserTypeBadge } from "@/components/user-type-badge";

// ── Types ────────────────────────────────────────────────────────────────────

type OrgItem = {
  kind: "org";
  id: string;
  name: string;
  slug: string;
  org_type: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  profile_image_url: string | null;
  description: string | null;
};

type UserItem = {
  kind: "user";
  id: string;
  name: string;
  role: string;
  bio: string | null;
};

type CommunityItem = OrgItem | UserItem;
type TypeFilter = "all" | "people" | "organization";
type RoleFilter = "" | "church" | "nonprofit" | "missionary" | "donor" | "member";

// ── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS: Record<string, string> = {
  donor: "bg-rose-100 text-rose-600",
  missionary: "bg-amber-100 text-amber-600",
  member: "bg-sky-100 text-sky-600",
  church: "bg-violet-100 text-violet-600",
  nonprofit: "bg-emerald-100 text-emerald-600",
  organization: "bg-slate-100 text-slate-600",
};

function avatarColor(role: string) {
  return AVATAR_COLORS[role] ?? "bg-slate-100 text-slate-600";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PLACEHOLDER_LOGO =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80";

function getOrgImage(item: OrgItem): string {
  return item.profile_image_url ?? item.logo_url ?? PLACEHOLDER_LOGO;
}

function getOrgTypeBadge(orgType: string | null) {
  switch (orgType) {
    case "church":
      return { label: "Church", className: "bg-amber-100/90 text-amber-800 backdrop-blur-sm" };
    case "nonprofit":
      return { label: "Nonprofit", className: "bg-sky-100/90 text-sky-800 backdrop-blur-sm" };
    case "missionary":
      return { label: "Missionary", className: "bg-violet-100/90 text-violet-800 backdrop-blur-sm" };
    default:
      return { label: "Organization", className: "bg-white/80 text-slate-600 backdrop-blur-sm" };
  }
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-xl">
      <div className="p-1">
        <div className="feed-shimmer aspect-[3/2] rounded-xl" />
      </div>
      <div className="space-y-2.5 p-4">
        <div className="feed-shimmer h-5 w-3/4 rounded-lg" />
        <div className="feed-shimmer h-4 w-full rounded-lg" />
        <div className="feed-shimmer h-4 w-1/2 rounded-lg" />
        <div className="flex gap-2 pt-1">
          <div className="feed-shimmer h-6 w-16 rounded-full" />
          <div className="feed-shimmer h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Person Card ───────────────────────────────────────────────────────────────
// motion.div is a bare wrapper (no CSS transition classes) — same pattern as
// OrgResultCard in the Explorer. All hover styles live on the inner div.

function PersonCard({
  item,
  index,
  onConnect,
  connectState,
}: {
  item: UserItem;
  index: number;
  onConnect: (id: string, type: "user") => void;
  connectState: "idle" | "loading" | "sent";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      <div className="group relative flex flex-col rounded-2xl border border-white/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-emerald-200/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(16,185,129,0.08)]">
        <div className="flex flex-col flex-1 p-4">
          {/* Avatar + name */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${avatarColor(item.role)}`}
            >
              {getInitials(item.name)}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <Link
                href={`/u/${item.id}`}
                className="block truncate font-semibold text-slate-900 transition-colors group-hover:text-emerald-700"
              >
                {item.name}
              </Link>
              <div className="mt-1">
                <UserTypeBadge type={item.role} size="xs" />
              </div>
            </div>
          </div>

          {/* Bio */}
          {item.bio ? (
            <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
              {item.bio}
            </p>
          ) : (
            <p className="mb-4 flex-1 text-sm italic text-slate-400">No bio yet.</p>
          )}

          {/* Actions */}
          <div className="mt-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => onConnect(item.id, "user")}
              disabled={connectState !== "idle"}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-default ${
                connectState === "sent"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              }`}
            >
              {connectState === "loading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : connectState === "sent" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              {connectState === "sent" ? "Sent" : "Connect"}
            </button>
            <Link
              href={`/u/${item.id}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Org Card ──────────────────────────────────────────────────────────────────
// Same pattern: bare motion.div wrapper, styled inner div, CSS transitions
// only on border/shadow (not transform) to avoid Framer Motion conflicts.

function OrgCard({
  item,
  index,
  onConnect,
  connectState,
}: {
  item: OrgItem;
  index: number;
  onConnect: (id: string, type: "organization") => void;
  connectState: "idle" | "loading" | "sent";
}) {
  const badge = getOrgTypeBadge(item.org_type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-emerald-200/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(16,185,129,0.08)]">
        {/* Image */}
        <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
          <Image
            src={getOrgImage(item)}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>

        <div className="flex flex-col flex-1 p-4">
          <Link
            href={`/org/${item.slug}`}
            className="font-semibold text-slate-900 transition-colors group-hover:text-emerald-700 line-clamp-1"
          >
            {item.name}
          </Link>

          {item.city && item.state && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              {item.city}, {item.state}
            </div>
          )}

          {item.description && (
            <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
              {item.description}
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onConnect(item.id, "organization")}
              disabled={connectState !== "idle"}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-default ${
                connectState === "sent"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              }`}
            >
              {connectState === "loading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : connectState === "sent" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              {connectState === "sent" ? "Sent" : "Connect"}
            </button>
            <Link
              href={`/org/${item.slug}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Filter config ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS: {
  id: TypeFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "all", label: "Everyone", icon: LayoutGrid },
  { id: "people", label: "People", icon: UserCircle2 },
  { id: "organization", label: "Organizations", icon: Building2 },
];

const ROLE_FILTERS: Record<TypeFilter, { label: string; value: RoleFilter; icon: React.ComponentType<{ className?: string }> }[]> = {
  all: [],
  people: [
    { label: "All Roles", value: "", icon: LayoutGrid },
    { label: "Donors", value: "donor", icon: Heart },
    { label: "Missionaries", value: "missionary", icon: Globe },
    { label: "Members", value: "member", icon: UserCircle2 },
  ],
  organization: [
    { label: "All Types", value: "", icon: LayoutGrid },
    { label: "Churches", value: "church", icon: Church },
    { label: "Nonprofits", value: "nonprofit", icon: Heart },
    { label: "Missionaries", value: "missionary", icon: Globe },
  ],
};

// Quick chips shown inside the hero (below the search pill)
const QUICK_CHIPS: { label: string; type: TypeFilter; role?: RoleFilter }[] = [
  { label: "Everyone", type: "all" },
  { label: "People", type: "people" },
  { label: "Churches", type: "organization", role: "church" },
  { label: "Nonprofits", type: "organization", role: "nonprofit" },
  { label: "Missionaries", type: "organization", role: "missionary" },
];

// ── Main Component ────────────────────────────────────────────────────────────

export function CommunityClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [results, setResults] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectStates, setConnectStates] = useState<
    Record<string, "idle" | "loading" | "sent">
  >({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchResults = useCallback(
    async (q: string, type: TypeFilter, role: RoleFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type, limit: "48" });
        if (q.length >= 2) params.set("q", q);
        if (role) params.set("role", role);
        const res = await fetch(`/api/community/members?${params}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchResults("", "all", "");
  }, [fetchResults]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(query, typeFilter, roleFilter);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, typeFilter, roleFilter, fetchResults]);

  const handleTypeChange = (t: TypeFilter, role: RoleFilter = "") => {
    setTypeFilter(t);
    setRoleFilter(role);
  };

  const handleConnect = async (id: string, type: "user" | "organization") => {
    setConnectStates((prev) => ({ ...prev, [id]: "loading" }));
    try {
      const res = await fetch("/api/peers/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: id, recipientType: type }),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/login?redirect=/community";
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setConnectStates((prev) => ({ ...prev, [id]: "sent" }));
      toast.success("Connection request sent!");
    } catch (e) {
      setConnectStates((prev) => ({ ...prev, [id]: "idle" }));
      toast.error(e instanceof Error ? e.message : "Failed to send request");
    }
  };

  const roleOptions = ROLE_FILTERS[typeFilter];
  const orgs = results.filter((r): r is OrgItem => r.kind === "org");
  const people = results.filter((r): r is UserItem => r.kind === "user");
  const hasResults = results.length > 0;
  const hasActiveFilters = typeFilter !== "all" || roleFilter !== "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[400px] left-1/4 h-[800px] w-[800px] rounded-full bg-emerald-100/30 blur-[120px]" />
        <div className="absolute -top-[200px] right-1/3 h-[600px] w-[600px] rounded-full bg-teal-100/25 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[600px] rounded-full bg-cyan-50/20 blur-[80px]" />
      </div>

      {/* Hero */}
      <section className="relative border-b border-white/60 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-xl shadow-emerald-900/10">
        {/* Hero background texture */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.06] blur-[80px]" />
          <div className="absolute -bottom-1/3 right-0 h-[400px] w-[400px] rounded-full bg-teal-400/10 blur-[60px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMC41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDcpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-60" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
            >
              <Users className="h-6 w-6 text-white" />
            </motion.div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Find Your Community
            </h1>
            <p className="mt-4 text-lg text-emerald-100/90">
              Connect with donors, missionaries, nonprofits, and churches across
              the GIVE network.
            </p>

            {/* Search bar — pill style matching HeroSearch */}
            <div className="relative mx-auto mt-8 w-full max-w-2xl">
              <div className="relative group">
                <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-white/50 transition-colors group-focus-within:text-emerald-400">
                  <Search className="h-6 w-6" />
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search people, churches, nonprofits…"
                  className="w-full rounded-full border border-white/[0.15] bg-white/[0.07] py-5 pl-16 pr-16 text-lg text-white placeholder:text-white/40 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition-all duration-300 focus:border-emerald-400/40 focus:bg-white/[0.1] focus:shadow-[0_8px_50px_rgba(16,185,129,0.12)] focus:outline-none focus:ring-2 focus:ring-emerald-400/20 sm:py-6 sm:pl-18 sm:pr-20 sm:text-xl"
                  autoComplete="off"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-white/60 transition-colors hover:text-white sm:right-4 sm:p-3"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                ) : (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500 p-2.5 text-white shadow-lg sm:right-4 sm:p-3">
                    <Search className="h-5 w-5" />
                  </span>
                )}
              </div>

              {/* Quick-filter chips inside hero */}
              <div className="mt-6 flex flex-wrap justify-center gap-2.5 sm:gap-3">
                {QUICK_CHIPS.map((chip) => {
                  const isActive =
                    typeFilter === chip.type &&
                    (chip.role ? roleFilter === chip.role : roleFilter === "");
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleTypeChange(chip.type, chip.role ?? "")}
                      className={`rounded-full border px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-all duration-200 sm:px-6 sm:py-3 sm:text-base ${
                        isActive
                          ? "border-emerald-400/50 bg-emerald-500/20 text-white"
                          : "border-white/[0.1] bg-white/[0.06] text-white/70 hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-white"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        {/* Filters card — matches ExploreFilters */}
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
                    onClick={() => handleTypeChange(id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                      typeFilter === id
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${typeFilter === id ? "text-emerald-100" : "text-slate-400"}`}
                    />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Role sub-filter + clear */}
            <div className="flex items-center gap-2">
              {roleOptions.length > 0 && (
                <>
                  <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Filter
                  </span>
                  <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                    {roleOptions.map(({ label, value, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRoleFilter(value)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                          roleFilter === value
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        <Icon
                          className={`h-3.5 w-3.5 ${roleFilter === value ? "text-emerald-100" : "text-slate-400"}`}
                        />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => { setTypeFilter("all"); setRoleFilter(""); }}
                  className="ml-2 flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition-all duration-200 hover:bg-rose-100"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !hasResults ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/60 bg-white/70 py-20 text-center shadow-sm backdrop-blur-xl"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-700">No results found</p>
            <p className="mx-auto mt-2 max-w-sm text-slate-500">
              Try a different search term or adjust the filters above.
            </p>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Clear search
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <div className="space-y-12">
              {/* Organizations */}
              {orgs.length > 0 && (
                <section>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Organizations</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                      {orgs.length}
                    </span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {orgs.map((item, i) => (
                      <OrgCard
                        key={item.id}
                        item={item}
                        index={i}
                        onConnect={handleConnect}
                        connectState={connectStates[item.id] ?? "idle"}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* People */}
              {people.length > 0 && (
                <section>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">People</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                      {people.length}
                    </span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {people.map((item, i) => (
                      <PersonCard
                        key={item.id}
                        item={item}
                        index={i}
                        onConnect={handleConnect}
                        connectState={connectStates[item.id] ?? "idle"}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}
