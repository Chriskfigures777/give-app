"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  DollarSign,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Light palette — matches the light feed right panel
const SB = {
  card:      "#ffffff",
  cardHover: "rgba(0,0,0,0.04)",
  border:    "rgba(0,0,0,0.08)",
  text:      "#111827",
  textMuted: "#4b5563",
  textDim:   "#9ca3af",
  accent:    "#059669",
  accentDim: "rgba(5,150,105,0.09)",
  inputBg:   "#f3f4f6",
} as const;

type Notification = {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "donation":
    case "donation_received":
      return { icon: DollarSign, color: SB.accent, bg: SB.accentDim };
    case "peer_request":
    case "peer_accepted":
    case "connection_request":
      return { icon: UserPlus, color: "#a78bfa", bg: "rgba(139,92,246,0.15)" };
    case "message":
    case "new_message":
      return { icon: MessageSquare, color: "#fbbf24", bg: "rgba(245,158,11,0.15)" };
    case "reaction":
    case "support":
      return { icon: Heart, color: "#fb7185", bg: "rgba(251,113,133,0.15)" };
    default:
      return { icon: Bell, color: SB.textMuted, bg: "rgba(0,0,0,0.06)" };
  }
}

function getNotificationText(n: Notification): string {
  const payload = n.payload ?? {};
  const name = (payload.from_name ?? payload.organization_name ?? "Someone") as string;
  switch (n.type) {
    case "donation":
    case "donation_received":
      return `${name} made a donation`;
    case "peer_request":
    case "connection_request":
      return `${name} sent you a peer request`;
    case "peer_accepted":
      return `${name} accepted your peer request`;
    case "message":
    case "new_message":
      return `${name} sent you a message`;
    case "reaction":
    case "support":
      return `${name} supported your post`;
    case "comment":
      return `${name} commented on your post`;
    default:
      return (payload.message as string) ?? "New notification";
  }
}

export function PanelNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
    } catch {
      /* ignore */
    } finally {
      setMarkingRead(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {
      /* ignore */
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-2.5 animate-pulse">
            <div className="h-8 w-8 rounded-lg shrink-0" style={{ background: SB.cardHover }} />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-3 w-full rounded-lg" style={{ background: SB.cardHover }} />
              <div className="h-2.5 w-1/3 rounded-lg" style={{ background: SB.inputBg }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header actions */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid ${SB.border}` }}>
          <span className="text-[11px] font-semibold" style={{ color: SB.textMuted }}>
            {unreadCount} unread
          </span>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingRead}
            className="flex items-center gap-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
            style={{ color: SB.accent }}
          >
            {markingRead ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3" />
            )}
            Mark all read
          </button>
        </div>
      )}

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(251,113,133,0.15)" }}>
            <Bell className="h-5 w-5" style={{ color: "#fb7185" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: SB.textMuted }}>All caught up!</p>
          <p className="mt-1 text-xs" style={{ color: SB.textMuted }}>
            No new notifications right now
          </p>
        </div>
      ) : (
        <div className="px-2 py-1">
          {notifications.map((n, i) => {
            const { icon: Icon, color, bg } = getNotificationIcon(n.type);
            const isUnread = !n.read_at;
            return (
              <motion.button
                key={n.id}
                type="button"
                onClick={() => !n.read_at && handleMarkRead(n.id)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                className={cn(
                  "mb-0.5 flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all duration-200"
                )}
                style={isUnread ? { background: "rgba(5,150,105,0.06)" } : undefined}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isUnread ? "rgba(5,150,105,0.06)" : "transparent"; }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: bg }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className="text-xs leading-snug"
                    style={{ color: isUnread ? SB.text : SB.textMuted, fontWeight: isUnread ? 600 : 500 }}
                  >
                    {getNotificationText(n)}
                  </p>
                  <p className="mt-0.5 text-[10px]" style={{ color: SB.textMuted }}>
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                {isUnread && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: SB.accent }} />
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-3" style={{ borderTop: `1px solid ${SB.border}` }}>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors"
          style={{ background: SB.inputBg, color: SB.textMuted }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; (e.currentTarget as HTMLElement).style.color = SB.text; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = SB.inputBg; (e.currentTarget as HTMLElement).style.color = SB.textMuted; }}
        >
          <Bell className="h-3.5 w-3.5" />
          View all activity
        </Link>
      </div>
    </div>
  );
}
