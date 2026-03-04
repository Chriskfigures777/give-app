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

// BANKGO-matching dark palette
const SB = {
  card:      "#181c26",
  cardHover: "#1e2330",
  border:    "rgba(255,255,255,0.06)",
  text:      "#eef0f6",
  textMuted: "#8891a5",
  textDim:   "#565e72",
  accent:    "#34d399",
  accentDim: "rgba(52,211,153,0.12)",
  inputBg:   "#12151c",
} as const;

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
            <div className="h-10 w-10 rounded-full shrink-0" style={{ background: SB.cardHover }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded-lg" style={{ background: SB.cardHover }} />
              <div className="h-2.5 w-1/2 rounded-lg" style={{ background: SB.inputBg }} />
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
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200"
          style={{
            background: SB.inputBg,
            border: searchQuery ? `1px solid rgba(52,211,153,0.35)` : `1px solid ${SB.border}`,
            boxShadow: searchQuery ? "0 0 0 3px rgba(52,211,153,0.06)" : "none",
          }}
        >
          {searching
            ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: SB.accent }} />
            : <Search className="h-3.5 w-3.5 shrink-0 transition-colors" style={{ color: searchQuery ? SB.accent : SB.textMuted }} />
          }
          <input
            type="text"
            placeholder="Search peers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length < 2) setSearchResults([]);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:opacity-50"
            style={{ color: SB.text }}
            autoComplete="off"
            spellCheck={false}
          />
          {searchQuery.length >= 2 && (
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: SB.accent }}
            >
              Go
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
            className="rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200"
            style={
              filter === f
                ? { background: "linear-gradient(to right, #10b981, #0d9488)", color: "#fff" }
                : { color: SB.textMuted, background: "transparent" }
            }
            onMouseEnter={(e) => {
              if (filter !== f) (e.currentTarget as HTMLElement).style.background = SB.cardHover;
            }}
            onMouseLeave={(e) => {
              if (filter !== f) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
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
            style={{ borderBottom: `1px solid ${SB.border}` }}
          >
            <div className="px-3 py-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: SB.textMuted }}>
                Search Results
              </p>
              {searchResults.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors"
                  style={{ cursor: "default" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: "rgba(139,92,246,0.2)" }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: "#a78bfa" }}>
                      {getInitials(r.name)}
                    </span>
                  </div>
                  <span className="flex-1 truncate text-sm font-medium" style={{ color: SB.text }}>
                    {r.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendRequest(r.id)}
                    disabled={actionLoading === r.id}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
                    style={{ background: SB.accentDim, color: SB.accent }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = SB.accentDim; }}
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
        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${SB.border}` }}>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: SB.textMuted }}>
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
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ background: "rgba(245,158,11,0.15)" }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: "#fbbf24" }}>
                      {getInitials(name)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: SB.text }}>
                      {name}
                    </p>
                    <p className="text-[11px]" style={{ color: SB.textMuted }}>
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
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                        style={{ background: SB.accentDim, color: SB.accent }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.2)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = SB.accentDim; }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(r.id)}
                        disabled={actionLoading === r.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                        style={{ background: "rgba(255,255,255,0.05)", color: SB.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>
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
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: SB.textMuted }}>
            <Users className="h-3 w-3" />
            Your Peers
            <span
              className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: SB.accentDim, color: SB.accent }}
            >
              {filteredPeers.length}
            </span>
          </p>
        )}

        {filteredPeers.length === 0 && filter !== "pending" ? (
          <div className="flex flex-col items-center rounded-xl px-4 py-8 text-center" style={{ background: SB.inputBg }}>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: SB.accentDim }}>
              <Sparkles className="h-5 w-5" style={{ color: SB.accent }} />
            </div>
            <p className="text-sm font-medium" style={{ color: SB.textMuted }}>No peers yet</p>
            <p className="mt-1 text-xs" style={{ color: SB.textMuted }}>
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
                <div
                  className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-all duration-200"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full p-[1.5px]"
                    style={{ background: `linear-gradient(135deg, ${SB.accentDim}, rgba(13,148,136,0.2))` }}
                  >
                    <div className="h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={getAvatar(peer.otherProfileImageUrl, peer.otherLogoUrl)}
                        alt={peer.otherName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <span
                      className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2"
                      style={{ background: "#22c55e", borderColor: SB.card }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: SB.text }}>
                      {peer.otherName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {peer.otherOrgSlug && (
                        <Link
                          href={`/org/${peer.otherOrgSlug}`}
                          className="flex items-center gap-0.5 text-[10px] font-medium transition-colors"
                          style={{ color: SB.accent }}
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          Visit
                        </Link>
                      )}
                      {peer.threadId && (
                        <Link
                          href={`/messages?thread=${peer.threadId}`}
                          className="flex items-center gap-0.5 text-[10px] font-medium transition-colors"
                          style={{ color: SB.textMuted }}
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

      {/* Footer link */}
      <div className="px-3 py-3" style={{ borderTop: `1px solid ${SB.border}` }}>
        <Link
          href="/dashboard/connections"
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors"
          style={{ background: SB.inputBg, color: SB.textMuted }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; (e.currentTarget as HTMLElement).style.color = SB.text; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = SB.inputBg; (e.currentTarget as HTMLElement).style.color = SB.textMuted; }}
        >
          <Users className="h-3.5 w-3.5" />
          View all peers
        </Link>
      </div>
    </div>
  );
}
