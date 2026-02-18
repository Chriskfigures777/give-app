"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Handshake, Search } from "lucide-react";
import { useUser } from "@/lib/use-user";
import { NavNotificationsDropdown } from "./nav-notifications-dropdown";
import { NavConnectionRequestsDropdown } from "./nav-connection-requests-dropdown";

export function DashboardNavBar() {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionRequestCount, setConnectionRequestCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [connectionRequestsOpen, setConnectionRequestsOpen] = useState(false);
  const notificationsAnchorRef = useRef<HTMLButtonElement>(null);
  const connectionRequestsAnchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setConnectionRequestCount(0);
      return;
    }
    fetch("/api/notifications/count")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => setUnreadCount(0));
    fetch("/api/peers/pending-requests")
      .then((r) => r.json())
      .then((d) => {
        const incoming = d.incoming ?? [];
        setConnectionRequestCount(incoming.length);
      })
      .catch(() => setConnectionRequestCount(0));
  }, [user]);

  if (!user) return null;

  return (
    <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-dashboard-border/60 px-5" style={{ background: "var(--dashboard-glass)", backdropFilter: "blur(16px) saturate(1.8)", WebkitBackdropFilter: "blur(16px) saturate(1.8)" }}>
      {/* Left: breadcrumb placeholder */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-2 rounded-xl bg-dashboard-card-hover/50 px-3 py-1.5 text-sm text-dashboard-text-muted">
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-4 hidden rounded bg-dashboard-card px-1.5 py-0.5 text-[10px] font-medium text-dashboard-text-muted border border-dashboard-border sm:inline-block">
            /
          </kbd>
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <button
            type="button"
            ref={connectionRequestsAnchorRef}
            onClick={() => {
              setConnectionRequestsOpen((o) => !o);
              setNotificationsOpen(false);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
              connectionRequestCount > 0
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text"
            }`}
            aria-label="Peers"
            aria-expanded={connectionRequestsOpen}
          >
            <Handshake className="h-[18px] w-[18px]" />
            {connectionRequestCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {connectionRequestCount > 9 ? "9+" : connectionRequestCount}
              </span>
            )}
          </button>
          <NavConnectionRequestsDropdown
            open={connectionRequestsOpen}
            onClose={() => setConnectionRequestsOpen(false)}
            anchorRef={connectionRequestsAnchorRef}
          />
        </div>
        <div className="relative">
          <button
            type="button"
            ref={notificationsAnchorRef}
            onClick={() => {
              setNotificationsOpen((o) => !o);
              setConnectionRequestsOpen(false);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
              unreadCount > 0
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text"
            }`}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NavNotificationsDropdown
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            anchorRef={notificationsAnchorRef}
            unreadCount={unreadCount}
            onUnreadChange={setUnreadCount}
            userId={user?.id}
          />
        </div>
      </div>
    </div>
  );
}
