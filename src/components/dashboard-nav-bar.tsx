"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Handshake } from "lucide-react";
import { useUser } from "@/lib/use-user";
import { NavNotificationsDropdown } from "./nav-notifications-dropdown";
import { NavConnectionRequestsDropdown } from "./nav-connection-requests-dropdown";
import { DashboardSearch } from "./dashboard-search";
import { DashboardThemePicker } from "./dashboard-theme-picker";

const TITLE_MAP: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/my-donations": "My Gifts",
  "/dashboard/missionary": "My Embed",
  "/community": "Community",
  "/dashboard/donations": "Donations",
  "/dashboard/connections": "Peers",
  "/dashboard/events": "Events",
  "/dashboard/campaigns": "Campaigns",
  "/dashboard/goals": "Goals",
  "/dashboard/eisenhower": "Priorities",
  "/dashboard/givers": "Givers",
  "/dashboard/profile": "Public Page",
  "/dashboard/pages": "Website Builder",
  "/dashboard/pages/cms": "Website Content",
  "/dashboard/custom-forms": "Payment Forms",
  "/dashboard/account": "My Profile",
  "/dashboard/settings": "Settings",
  "/dashboard/billing": "Plan & Billing",
  "/dashboard/connect/verify": "Payout Account",
  "/dashboard/connect/manage": "Manage Billing",
  "/dashboard/admin": "Platform Admin",
  "/dashboard/survey-results": "Survey Results",
};

function getPageTitle(pathname: string): string {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  // Match prefix patterns
  for (const [key, val] of Object.entries(TITLE_MAP)) {
    if (pathname.startsWith(key + "/")) return val;
  }
  // Fallback: humanize last path segment
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard";
}

export function DashboardNavBar() {
  const { user } = useUser();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

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
    <div
      className="sticky top-0 z-40 flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-dashboard-border/60 px-6"
      style={{
        background: "var(--dashboard-glass)",
        backdropFilter: "blur(16px) saturate(1.8)",
        WebkitBackdropFilter: "blur(16px) saturate(1.8)",
      }}
    >
      {/* Left: page title */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-[15px] font-bold text-dashboard-text truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-1.5">
        <DashboardSearch />
        <DashboardThemePicker size="sm" placement="top" />

        {/* Connection requests */}
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

        {/* Notifications */}
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
