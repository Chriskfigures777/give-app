"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  UserPlus,
  Check,
  X,
  MessageSquare,
  ExternalLink,
  Users,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type PeerConnection = {
  id: string;
  otherName: string;
  otherOrgSlug: string | null;
  otherLogoUrl?: string | null;
  otherProfileImageUrl?: string | null;
  threadId?: string | null;
};

type PendingRequest = {
  id: string;
  requesterName?: string;
  requesterSlug?: string;
  recipientName?: string;
  recipientSlug?: string;
  canAccept: boolean;
  direction: "incoming" | "outgoing";
  created_at: string;
};

type SearchResult = {
  id: string;
  type: string;
  name: string;
};

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80";

function getAvatar(profileUrl?: string | null, logoUrl?: string | null): string {
  return profileUrl ?? logoUrl ?? PLACEHOLDER_IMG;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

type FilterType = "all" | "connected" | "pending";

export function PanelPeers() {
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [connRes, pendRes] = await Promise.all([
        fetch("/api/peers/connections"),
        fetch("/api/peers/pending-requests"),
      ]);
      const connData = await connRes.json();
      const pendData = await pendRes.json();
      setPeers(connData.connections ?? []);

      const incoming = (pendData.incoming ?? []).map(
        (r: { id: string; requesterName?: string; requesterSlug?: string; created_at: string }) => ({
          ...r,
          canAccept: true,
          direction: "incoming" as const,
        })
      );
      const outgoing = (pendData.outgoing ?? []).map(
        (r: { id: string; recipientName?: string; recipientSlug?: string; created_at: string }) => ({
          ...r,
          canAccept: false,
          direction: "outgoing" as const,
        })
      );
      setPendingRequests([...incoming, ...outgoing]);
    } catch {
      setPeers([]);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/peers/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (recipientId: string) => {
    setActionLoading(recipientId);
    try {
      const res = await fetch("/api/peers/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Peer request sent!");
      setSearchResults((prev) => prev.filter((r) => r.id !== recipientId));
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/peers/requests/${id}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Peer request accepted!");
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to accept");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/peers/requests/${id}/decline`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Request declined");
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Failed to decline");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPeers =
    filter === "pending"
      ? []
      : peers.filter(
          (p) =>
            !searchQuery ||
            p.otherName.toLowerCase().includes(searchQuery.toLowerCase())
        );

  const filteredPending =
    filter === "connected"
      ? []
      : pendingRequests.filter(
          (r) =>
            !searchQuery ||
            (r.requesterName ?? r.recipientName ?? "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        );

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded-lg bg-slate-100" />
              <div className="h-2.5 w-1/2 rounded-lg bg-slate-50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Search bar */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search peers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length < 2) setSearchResults([]);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10"
          />
          {searchQuery.length >= 2 && (
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Find"}
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1 px-3 pb-2">
        {(["all", "connected", "pending"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 ${
              filter === f
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {f === "all" ? "All" : f === "connected" ? "Connected" : "Pending"}
            {f === "pending" && pendingRequests.length > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px]">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search results */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-slate-100/80"
          >
            <div className="px-3 py-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Search Results
              </p>
              {searchResults.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100">
                    <span className="text-[10px] font-bold text-violet-600">
                      {getInitials(r.name)}
                    </span>
                  </div>
                  <span className="flex-1 truncate text-sm font-medium text-slate-700">
                    {r.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendRequest(r.id)}
                    disabled={actionLoading === r.id}
                    className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {actionLoading === r.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3" />
                    )}
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending requests */}
      {filteredPending.length > 0 && (
        <div className="border-b border-slate-100/80 px-3 py-2">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <Clock className="h-3 w-3" />
            Pending Requests
          </p>
          <div className="space-y-1">
            {filteredPending.map((r, i) => {
              const name =
                r.direction === "incoming"
                  ? r.requesterName ?? "Organization"
                  : r.recipientName ?? "Organization";
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100">
                    <span className="text-[10px] font-bold text-amber-600">
                      {getInitials(name)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {r.direction === "incoming" ? "Wants to connect" : "Request sent"}{" "}
                      &middot; {timeAgo(r.created_at)}
                    </p>
                  </div>
                  {r.canAccept ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleAccept(r.id)}
                        disabled={actionLoading === r.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(r.id)}
                        disabled={actionLoading === r.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      Sent
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connected peers */}
      <div className="px-3 py-2">
        {filter !== "pending" && (
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <Users className="h-3 w-3" />
            Your Peers
            <span className="ml-auto rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
              {filteredPeers.length}
            </span>
          </p>
        )}

        {filteredPeers.length === 0 && filter !== "pending" ? (
          <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 px-4 py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">No peers yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Search above to find organizations and connect
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredPeers.map((peer, i) => (
              <motion.div
                key={peer.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
              >
                <div className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-all duration-200 hover:bg-slate-50">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 p-[1.5px]">
                    <div className="h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={getAvatar(peer.otherProfileImageUrl, peer.otherLogoUrl)}
                        alt={peer.otherName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 group-hover:text-slate-900">
                      {peer.otherName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {peer.otherOrgSlug && (
                        <Link
                          href={`/org/${peer.otherOrgSlug}`}
                          className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          Visit
                        </Link>
                      )}
                      {peer.threadId && (
                        <Link
                          href={`/messages?thread=${peer.threadId}`}
                          className="flex items-center gap-0.5 text-[10px] font-medium text-slate-500 transition-colors hover:text-slate-700"
                        >
                          <MessageSquare className="h-2.5 w-2.5" />
                          Message
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom link to full peers page */}
      <div className="border-t border-slate-100/80 px-3 py-3">
        <Link
          href="/dashboard/connections"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-50/80 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Users className="h-3.5 w-3.5" />
          View all peers
        </Link>
      </div>
    </div>
  );
}
