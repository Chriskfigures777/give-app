"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { Check, CheckCheck, Bell, Sparkles, Heart, MessageSquare, DollarSign, Handshake, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { NotificationItem } from "@/app/api/notifications/route";

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  unreadCount: number;
  onUnreadChange?: (count: number) => void;
  userId?: string | null;
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
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

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, type: "spring" as const, stiffness: 300, damping: 24 },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

function SkeletonLoader() {
  return (
    <div className="px-4 py-3 space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded-lg bg-slate-100" />
            <div className="h-3 w-1/3 rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "connection_accepted":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Sparkles className="h-4 w-4" />
        </div>
      );
    case "connection_request":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Handshake className="h-4 w-4" />
        </div>
      );
    case "donation_received":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Heart className="h-4 w-4" />
        </div>
      );
    case "message_received":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <MessageSquare className="h-4 w-4" />
        </div>
      );
    case "fund_request_received":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <DollarSign className="h-4 w-4" />
        </div>
      );
    case "fund_request_fulfilled":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <DollarSign className="h-4 w-4" />
        </div>
      );
    default:
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Bell className="h-4 w-4" />
        </div>
      );
  }
}

function getNotificationText(n: NotificationItem): string {
  const p = n.payload;
  switch (n.type) {
    case "connection_accepted":
      return `${(p.organization_name as string) ?? "An organization"} accepted your connection request`;
    case "connection_request":
      return `${(p.organization_name as string) ?? "An organization"} wants to connect with you`;
    case "donation_received": {
      const amount = p.amount_cents
        ? formatCents(p.amount_cents as number, (p.currency as string) ?? "usd")
        : "a donation";
      const donor = (p.donor_name as string) || "Someone";
      const suffix = p.is_recurring ? " (recurring)" : "";
      return `${donor} donated ${amount}${suffix}`;
    }
    case "message_received":
      return `${(p.sender_name as string) ?? "Someone"} sent you a message`;
    case "fund_request_received": {
      const amount = p.amount_cents
        ? formatCents(p.amount_cents as number, "usd")
        : "funds";
      return `${(p.organization_name as string) ?? "An organization"} sent a fund request for ${amount}`;
    }
    case "fund_request_fulfilled":
      return "Your fund request has been fulfilled";
    default:
      return n.type.replace(/_/g, " ");
  }
}

function getNotificationLink(n: NotificationItem): string | null {
  const p = n.payload;
  switch (n.type) {
    case "connection_accepted":
      return "/dashboard/connections";
    case "connection_request":
      return "/dashboard/connections";
    case "donation_received":
      return "/dashboard/donations";
    case "message_received":
      return p.thread_id ? `/dashboard/messages/${p.thread_id as string}` : "/dashboard/messages";
    case "fund_request_received":
      return p.thread_id ? `/dashboard/messages/${p.thread_id as string}` : "/dashboard/messages";
    case "fund_request_fulfilled":
      return "/dashboard/messages";
    default:
      return null;
  }
}

export function NavNotificationsDropdown({
  open,
  onClose,
  anchorRef,
  unreadCount: initialUnread,
  onUnreadChange,
  userId,
}: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // connection_request type has its own dedicated dropdown — filter from bell
  const filteredNotifications = notifications.filter((n) => n.type !== "connection_request");

  useEffect(() => {
    setUnreadCount(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => {
          const list = (d.notifications ?? []) as NotificationItem[];
          setNotifications(list);
          fetch("/api/notifications/count")
            .then((c) => c.json())
            .then((c) => {
              setUnreadCount(c.unreadCount ?? 0);
              onUnreadChange?.(c.unreadCount ?? 0);
            });
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  // Real-time subscription: show toast + update badge on new notifications
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newRow = payload.new as NotificationItem;

          // connection_request type goes to the peers dropdown — skip it here
          if (newRow.type === "connection_request") return;

          // Prepend to list
          setNotifications((prev) => [newRow, ...prev]);
          setUnreadCount((c) => {
            const next = c + 1;
            onUnreadChange?.(next);
            return next;
          });

          // Show a Sonner toast for the new notification
          const text = getNotificationText(newRow);
          const link = getNotificationLink(newRow);
          if (link) {
            toast(text, {
              action: {
                label: "View",
                onClick: () => {
                  window.location.href = link;
                },
              },
            });
          } else {
            toast(text);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUnreadChange]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        anchorRef.current?.contains(e.target as Node)
      )
        return;
      onClose();
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [open, onClose, anchorRef]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    onUnreadChange?.(Math.max(0, unreadCount - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
    onUnreadChange?.(0);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-[100] mt-2.5 w-[380px] max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
        >
          {/* Header */}
          <div className="border-b border-slate-100/80 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-100 px-1.5 text-[11px] font-bold text-emerald-700"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </div>
              {unreadCount > 0 && (
                <motion.button
                  type="button"
                  onClick={markAllRead}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </motion.button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto overscroll-contain scrollbar-thin">
            {loading ? (
              <SkeletonLoader />
            ) : filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-3 px-4 py-10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm text-slate-400">No notifications yet</p>
              </motion.div>
            ) : (
              <ul className="py-1">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((n, i) => {
                    const link = getNotificationLink(n);
                    const text = getNotificationText(n);

                    const itemContent = (
                      <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors duration-150">
                        {getNotificationIcon(n.type)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 leading-snug">
                            {text}
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-slate-400">
                            {formatRelativeTime(n.created_at)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {link && (
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-slate-500">
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {!n.read_at && (
                            <motion.button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markRead(n.id);
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-emerald-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </motion.button>
                          )}
                        </div>
                      </div>
                    );

                    return (
                      <motion.li
                        key={n.id}
                        layout
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        custom={i}
                        className={`border-b border-slate-50/80 last:border-0 transition-colors duration-200 ${
                          !n.read_at
                            ? "bg-gradient-to-r from-emerald-50/50 via-emerald-50/30 to-transparent"
                            : ""
                        }`}
                      >
                        {link ? (
                          <Link
                            href={link}
                            onClick={() => {
                              if (!n.read_at) markRead(n.id);
                              onClose();
                            }}
                            className="block"
                          >
                            {itemContent}
                          </Link>
                        ) : (
                          itemContent
                        )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
