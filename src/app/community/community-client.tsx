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
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { UserTypeBadge } from "@/components/user-type-badge";

// ── Types ───────────────────────────────────────────────────────────────────

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
type RoleFilter =
  | ""
  | "church"
  | "nonprofit"
  | "missionary"
  | "donor"
  | "member";

// ── Avatar color map ────────────────────────────────────────────────────────

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

// ── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-sm">
      <div className="mb-4 h-24 rounded-xl bg-slate-100" />
      <div className="h-4 w-2/3 rounded bg-slate-100 mb-2" />
      <div className="h-3 w-1/3 rounded bg-slate-100 mb-3" />
      <div className="h-3 w-full rounded bg-slate-100 mb-1.5" />
      <div className="h-3 w-4/5 rounded bg-slate-100" />
    </div>
  );
}

// ── Person Card ─────────────────────────────────────────────────────────────

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col rounded-2xl border border-white/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300 hover:border-sky-200/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
    >
      <div className="p-5 flex flex-col flex-1">
        {/* Avatar + badge row */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${avatarColor(item.role)}`}
          >
            {getInitials(item.name)}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <Link
              href={`/u/${item.id}`}
              className="block truncate text-base font-semibold text-slate-900 hover:text-sky-700 transition-colors"
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
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 flex-1 mb-4">
            {item.bio}
          </p>
        ) : (
          <p className="text-sm italic text-slate-400 flex-1 mb-4">No bio yet.</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            type="button"
            onClick={() => onConnect(item.id, "user")}
            disabled={connectState !== "idle"}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-default ${
              connectState === "sent"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:border-sky-200 hover:text-sky-600 hover:bg-sky-50"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Org Card ────────────────────────────────────────────────────────────────

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col rounded-2xl border border-white/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300 hover:border-emerald-200/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
    >
      {/* Image */}
      <div className="relative aspect-[3/2] overflow-hidden rounded-t-2xl bg-slate-100">
        <Image
          src={getOrgImage(item)}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
        {item.org_type && (
          <div className="absolute bottom-3 left-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm ${
                item.org_type === "church"
                  ? "bg-violet-100/90 text-violet-800"
                  : item.org_type === "nonprofit"
                  ? "bg-sky-100/90 text-sky-800"
                  : "bg-amber-100/90 text-amber-800"
              }`}
            >
              {item.org_type.charAt(0).toUpperCase() + item.org_type.slice(1)}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <Link
          href={`/org/${item.slug}`}
          className="text-base font-semibold text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1"
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
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500 flex-1">
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

const TYPE_FILTERS: { label: string; value: TypeFilter }[] = [
  { label: "Everyone", value: "all" },
  { label: "People", value: "people" },
  { label: "Organizations", value: "organization" },
];

const ROLE_FILTERS: Record<TypeFilter, { label: string; value: RoleFilter }[]> = {
  all: [],
  people: [
    { label: "All Roles", value: "" },
    { label: "Donors", value: "donor" },
    { label: "Missionaries", value: "missionary" },
    { label: "Members", value: "member" },
  ],
  organization: [
    { label: "All Types", value: "" },
    { label: "Churches", value: "church" },
    { label: "Nonprofits", value: "nonprofit" },
    { label: "Missionaries", value: "missionary" },
  ],
};

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

  // Initial load
  useEffect(() => {
    fetchResults("", "all", "");
  }, [fetchResults]);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(query, typeFilter, roleFilter);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, typeFilter, roleFilter, fetchResults]);

  const handleTypeChange = (t: TypeFilter) => {
    setTypeFilter(t);
    setRoleFilter("");
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

  // Separate into orgs and users for ordered rendering (orgs first when "all")
  const orgs = results.filter((r): r is OrgItem => r.kind === "org");
  const people = results.filter((r): r is UserItem => r.kind === "user");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 pb-20 pt-14 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/20">
            <Users className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Find Your Community</h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-sky-100/90 leading-relaxed">
            Connect with donors, missionaries, nonprofits, and churches across
            the GIVE network.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-1.5 ring-1 ring-white/20 backdrop-blur-sm focus-within:bg-white/15 focus-within:ring-white/40 transition-all">
              <Search className="h-5 w-5 shrink-0 text-white/70" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, city, or type…"
                className="flex-1 bg-transparent py-2.5 text-base text-white placeholder:text-white/60 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-full p-1 text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-0 z-20 -mt-6 border-b border-slate-200/60 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400 mr-1" />
            {/* Type tabs */}
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => handleTypeChange(f.value)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  typeFilter === f.value
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}

            {/* Sub-filters */}
            {roleOptions.length > 0 && (
              <>
                <span className="mx-1 h-5 w-px shrink-0 bg-slate-200" />
                {roleOptions.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRoleFilter(r.value)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      roleFilter === r.value
                        ? "bg-slate-800 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No results found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">
              Try a different search term or adjust the filters above.
            </p>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <div className="space-y-10">
              {/* Organizations */}
              {orgs.length > 0 && (
                <section>
                  {typeFilter === "all" && (
                    <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                      <span className="h-px flex-1 bg-slate-200" />
                      Organizations ({orgs.length})
                      <span className="h-px flex-1 bg-slate-200" />
                    </h2>
                  )}
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
                  {typeFilter === "all" && (
                    <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                      <span className="h-px flex-1 bg-slate-200" />
                      People ({people.length})
                      <span className="h-px flex-1 bg-slate-200" />
                    </h2>
                  )}
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
    </div>
  );
}
