"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Check,
  X,
  MessageSquare,
  ExternalLink,
  Link2,
  Clock,
  Sparkles,
  Loader2,
  Users,
  Handshake,
  Send,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PendingRequest = {
  id: string;
  requester_id: string;
  requester_type: string;
  recipient_id: string;
  recipient_type: string;
  message: string | null;
  created_at: string;
  canAccept: boolean;
};

type Connection = {
  id: string;
  side_a_id: string;
  side_a_type: string;
  side_b_id: string;
  side_b_type: string;
  created_at: string | null;
};

type OrgProfile = {
  name: string;
  slug: string | null;
  logo_url: string | null;
  profile_image_url: string | null;
};

type Props = {
  pendingRequests: PendingRequest[];
  connections: Connection[];
  connectionThreads: Record<string, string>;
  orgId: string;
  orgNames: Record<string, string>;
  orgProfiles: Record<string, OrgProfile>;
};

const PLACEHOLDER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConnectionsClient({
  pendingRequests,
  connections,
  connectionThreads,
  orgId,
  orgNames,
  orgProfiles,
}: Props) {
  const router = useRouter();
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; type: string; name: string; slug?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [pending, setPending] = useState(pendingRequests);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const activeThreads = useMemo(
    () => connections.filter((c) => connectionThreads[c.id]).length,
    [connections, connectionThreads]
  );

  const handleSearch = async () => {
    if (searchQ.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/peers/search?q=${encodeURIComponent(searchQ)}`
      );
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (recipientId: string) => {
    setSendingTo(recipientId);
    try {
      const res = await fetch("/api/peers/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Connection request sent!");
      setSearchResults((prev) => prev.filter((r) => r.id !== recipientId));
      if (searchResults.length <= 1) {
        setSearchQ("");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSendingTo(null);
    }
  };

  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    try {
      const res = await fetch(`/api/peers/requests/${id}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to accept");
      toast.success("Connection accepted!");
      setPending((p) => p.filter((r) => r.id !== id));
      if (data.connectionId) {
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to accept");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setDecliningId(id);
    try {
      const res = await fetch(`/api/peers/requests/${id}/decline`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      setPending((p) => p.filter((r) => r.id !== id));
      toast.success("Request declined");
    } catch {
      toast.error("Failed to decline");
    } finally {
      setDecliningId(null);
    }
  };

  const getThreadId = (connId: string) => connectionThreads[connId] ?? null;

  return (
    <div className="space-y-6 p-2 sm:p-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="dashboard-fade-in dashboard-fade-in-delay-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-dashboard-text">
            Connections
          </h1>
          <p className="text-sm text-dashboard-text-muted mt-0.5">
            Build your network — connect with organizations, collaborate, and grow together.
          </p>
        </div>
      </div>

      {/* Missionaries section */}
      <div className="dashboard-fade-in dashboard-fade-in-delay-2 rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
        <div className="border-b border-dashboard-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
              <UserPlus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-dashboard-text">
                Missionaries
              </h2>
              <p className="text-xs text-dashboard-text-muted">
                Add givers as missionaries to split revenue with them. Create accounts for new missionaries.
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/givers"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Users className="h-4 w-4" />
              Add from Givers
            </Link>
            <Link
              href="/dashboard/givers"
              className="inline-flex items-center gap-2 rounded-lg border border-dashboard-border px-4 py-2.5 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
            >
              Create missionary
            </Link>
          </div>
          <p className="text-xs text-dashboard-text-muted">
            Go to Givers to add existing givers as missionaries. For someone who hasn&apos;t signed up, share your give page and ask them to sign up as a Giver with &quot;Yes&quot; to missionary — then add them from Givers once they&apos;re in the system.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Connections",
            value: connections.length.toString(),
            sub: connections.length === 1 ? "Organization" : "Organizations",
            icon: Link2,
            gradient: "from-emerald-500/10 to-teal-500/10",
            iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            delay: "dashboard-fade-in-delay-2",
          },
          {
            label: "Pending Requests",
            value: pending.length.toString(),
            sub: pending.length === 1 ? "Awaiting response" : "Awaiting responses",
            icon: Clock,
            gradient: "from-amber-500/10 to-orange-500/10",
            iconBg: "bg-amber-100 dark:bg-amber-500/20",
            iconColor: "text-amber-600 dark:text-amber-400",
            delay: "dashboard-fade-in-delay-3",
          },
          {
            label: "Active Threads",
            value: activeThreads.toString(),
            sub: activeThreads === 1 ? "Message thread" : "Message threads",
            icon: MessageSquare,
            gradient: "from-blue-500/10 to-cyan-500/10",
            iconBg: "bg-blue-100 dark:bg-blue-500/20",
            iconColor: "text-blue-600 dark:text-blue-400",
            delay: "dashboard-fade-in-delay-4",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`dashboard-fade-in ${card.delay} kpi-card rounded-2xl border border-dashboard-border bg-gradient-to-br ${card.gradient} bg-dashboard-card p-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-dashboard-text">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-dashboard-text-muted">
                    {card.sub}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} transition-transform duration-300`}
                >
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Connect */}
      <div className="dashboard-fade-in dashboard-fade-in-delay-5 rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
        <div className="border-b border-dashboard-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
              <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-dashboard-text">
                Find organizations
              </h2>
              <p className="text-xs text-dashboard-text-muted">
                Search by name to send connection requests
              </p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div
            className={`flex gap-2 rounded-xl border p-1 transition-all duration-300 ${
              searchFocused
                ? "border-emerald-500/50 ring-2 ring-emerald-500/20 bg-dashboard-card"
                : "border-dashboard-border bg-dashboard-card-hover/30"
            }`}
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search
                className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                  searchFocused
                    ? "text-emerald-500"
                    : "text-dashboard-text-muted"
                }`}
              />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search organizations by name..."
                className="w-full bg-transparent py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/60 outline-none"
              />
              {searchQ && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQ("");
                    setSearchResults([]);
                  }}
                  className="shrink-0 rounded-md p-1 text-dashboard-text-muted hover:text-dashboard-text transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading || searchQ.length < 2}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-lg gap-1.5 shadow-sm px-5 transition-all duration-200 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 conn-search-results">
              <p className="text-xs font-medium text-dashboard-text-muted px-1 mb-3">
                {searchResults.length} organization{searchResults.length !== 1 ? "s" : ""} found
              </p>
              {searchResults.map((r, i) => (
                <div
                  key={`${r.type}-${r.id}`}
                  className="conn-result-item group flex items-center justify-between rounded-xl border border-dashboard-border bg-dashboard-card-hover/20 px-4 py-3 transition-all duration-200 hover:border-emerald-500/30 hover:bg-dashboard-card-hover/50 hover:shadow-sm"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {getInitials(r.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dashboard-text">
                        {r.name}
                      </p>
                      {r.slug && (
                        <p className="text-xs text-dashboard-text-muted">
                          @{r.slug}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSendRequest(r.id)}
                    disabled={sendingTo === r.id}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-lg gap-1.5 shadow-sm text-xs transition-all duration-200"
                  >
                    {sendingTo === r.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="dashboard-fade-in dashboard-fade-in-delay-6 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:border-amber-700/30 dark:from-amber-900/10 dark:to-orange-900/10 shadow-sm overflow-hidden">
          <div className="border-b border-amber-200/40 dark:border-amber-700/20 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-dashboard-text">
                    Incoming requests
                  </h2>
                  <p className="text-xs text-dashboard-text-muted">
                    {pending.length} organization{pending.length !== 1 ? "s" : ""} want to connect
                  </p>
                </div>
              </div>
              <span className="conn-pulse-badge inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <span className="conn-pulse-dot relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                {pending.length} new
              </span>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {pending.map((r, i) => {
              const profile = orgProfiles[r.requester_id];
              const name = orgNames[r.requester_id] ?? "Organization";
              const avatarUrl =
                profile?.profile_image_url ??
                profile?.logo_url ??
                PLACEHOLDER_AVATAR;
              const isAccepting = acceptingId === r.id;
              const isDeclining = decliningId === r.id;
              return (
                <div
                  key={r.id}
                  className="conn-request-card group flex items-center gap-4 rounded-xl border border-amber-200/40 dark:border-amber-700/20 bg-white/60 dark:bg-white/5 p-4 transition-all duration-200 hover:border-amber-300/60 dark:hover:border-amber-600/30 hover:shadow-sm"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex shrink-0 overflow-hidden rounded-xl ring-2 ring-amber-200/60 dark:ring-amber-700/30">
                    {avatarUrl === PLACEHOLDER_AVATAR ? (
                      <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-sm font-bold text-amber-600 dark:text-amber-400">
                        {getInitials(name)}
                      </div>
                    ) : (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="h-12 w-12 object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-dashboard-text">
                      {name}
                    </p>
                    {r.message ? (
                      <p className="mt-0.5 text-xs text-dashboard-text-muted line-clamp-1">
                        &ldquo;{r.message}&rdquo;
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-dashboard-text-muted">
                        Wants to connect with your organization
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-dashboard-text-muted/60">
                      {timeAgo(r.created_at)}
                    </p>
                  </div>
                  {r.canAccept && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(r.id)}
                        disabled={isAccepting || isDeclining}
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-lg gap-1.5 shadow-sm text-xs transition-all duration-200"
                      >
                        {isAccepting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(r.id)}
                        disabled={isAccepting || isDeclining}
                        className="rounded-lg gap-1.5 text-xs transition-all duration-200 border-dashboard-border hover:border-red-300 hover:text-red-600 dark:hover:border-red-700 dark:hover:text-red-400"
                      >
                        {isDeclining ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Your Connections */}
      <div className="dashboard-fade-in dashboard-fade-in-delay-7 rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
        <div className="border-b border-dashboard-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                <Handshake className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-dashboard-text">
                  Your connections
                </h2>
                <p className="text-xs text-dashboard-text-muted">
                  {connections.length} organization{connections.length !== 1 ? "s" : ""} in your network
                </p>
              </div>
            </div>
          </div>
        </div>

        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="conn-empty-icon relative mb-6">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200/40 dark:border-emerald-700/30">
                <Users className="h-9 w-9 text-emerald-500/60" />
              </div>
            </div>
            <p className="text-base font-semibold text-dashboard-text">
              No connections yet
            </p>
            <p className="mt-2 max-w-sm text-sm text-dashboard-text-muted">
              Start building your network by searching for organizations above. Connected organizations can message each other and collaborate on campaigns.
            </p>
            <button
              type="button"
              onClick={() => {
                const searchInput = document.querySelector<HTMLInputElement>(
                  'input[placeholder*="Search organizations"]'
                );
                searchInput?.focus();
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
            >
              <Search className="h-4 w-4" />
              Find organizations
            </button>
          </div>
        ) : (
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map((c, i) => {
                const otherId =
                  c.side_a_id === orgId ? c.side_b_id : c.side_a_id;
                const profile = orgProfiles[otherId];
                const name = orgNames[otherId] ?? "Organization";
                const avatarUrl =
                  profile?.profile_image_url ??
                  profile?.logo_url ??
                  PLACEHOLDER_AVATAR;
                const threadId = getThreadId(c.id);
                const orgSlug = profile?.slug;
                const hasAvatar = avatarUrl !== PLACEHOLDER_AVATAR;

                return (
                  <div
                    key={c.id}
                    className="conn-card group relative rounded-2xl border border-dashboard-border bg-dashboard-card p-5 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-teal-500/0 transition-all duration-300 group-hover:from-emerald-500/[0.02] group-hover:to-teal-500/[0.04]" />

                    <div className="relative">
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3.5">
                        {orgSlug ? (
                          <Link
                            href={`/org/${orgSlug}`}
                            className="flex shrink-0 overflow-hidden rounded-xl ring-2 ring-dashboard-border transition-all duration-300 group-hover:ring-emerald-500/40 group-hover:shadow-md"
                          >
                            {hasAvatar ? (
                              <img
                                src={avatarUrl}
                                alt={name}
                                className="h-13 w-13 object-cover"
                              />
                            ) : (
                              <div className="flex h-13 w-13 items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-base font-bold text-emerald-600 dark:text-emerald-400">
                                {getInitials(name)}
                              </div>
                            )}
                          </Link>
                        ) : (
                          <div className="flex shrink-0 overflow-hidden rounded-xl ring-2 ring-dashboard-border">
                            {hasAvatar ? (
                              <img
                                src={avatarUrl}
                                alt={name}
                                className="h-13 w-13 object-cover"
                              />
                            ) : (
                              <div className="flex h-13 w-13 items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-base font-bold text-emerald-600 dark:text-emerald-400">
                                {getInitials(name)}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          {orgSlug ? (
                            <Link
                              href={`/org/${orgSlug}`}
                              className="block truncate text-sm font-semibold text-dashboard-text transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span className="block truncate text-sm font-semibold text-dashboard-text">
                              {name}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[11px] text-dashboard-text-muted">
                              Connected {timeAgo(c.created_at) ? timeAgo(c.created_at).toLowerCase() : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="my-4 h-px bg-dashboard-border/60" />

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {orgSlug && (
                          <Link
                            href={`/org/${orgSlug}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-dashboard-border px-3 py-2 text-xs font-medium text-dashboard-text-muted transition-all duration-200 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Profile
                          </Link>
                        )}
                        {threadId ? (
                          <Link
                            href={`/dashboard/messages?thread=${threadId}`}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Message
                          </Link>
                        ) : (
                          <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashboard-border px-3 py-2 text-xs font-medium text-dashboard-text-muted">
                            <MessageSquare className="h-3.5 w-3.5" />
                            No thread yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
