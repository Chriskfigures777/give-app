"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DashboardNavBar } from "@/components/dashboard-nav-bar";

const AUTO_COLLAPSE_PATHS = ["/dashboard/custom-forms", "/dashboard/notes"];
const SIDEBAR_OPEN_WIDTH = 260;
const SIDEBAR_CLOSED_WIDTH = 72;

type Props = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  stripeTestBanner?: React.ReactNode;
};

export function DashboardLayoutClient({
  sidebar,
  children,
  stripeTestBanner,
}: Props) {
  const pathname = usePathname();
  const isFullScreenBuilder =
    pathname.startsWith("/dashboard/pages") && !pathname.startsWith("/dashboard/pages/cms");
  const isAutoCollapsePage = AUTO_COLLAPSE_PATHS.some((p) => pathname.startsWith(p));

  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const initialLoadRef = useRef(true);
  const wasAutoCollapseRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      wasAutoCollapseRef.current = isAutoCollapsePage;
      if (isAutoCollapsePage) setCollapsed(true);
      return;
    }

    if (isAutoCollapsePage && !wasAutoCollapseRef.current) {
      setCollapsed(true);
    } else if (!isAutoCollapsePage && wasAutoCollapseRef.current) {
      setCollapsed(false);
    }

    wasAutoCollapseRef.current = isAutoCollapsePage;
  }, [pathname, mounted, isAutoCollapsePage]);

  if (isFullScreenBuilder) {
    return (
      <div className="fixed inset-0 h-screen w-screen overflow-y-auto overflow-x-hidden bg-dashboard">
        {children}
      </div>
    );
  }

  const sidebarWidth = mounted
    ? collapsed ? SIDEBAR_CLOSED_WIDTH : SIDEBAR_OPEN_WIDTH
    : SIDEBAR_OPEN_WIDTH;

  return (
    <div className="min-h-screen bg-dashboard">
      {/* Fixed sidebar — CSS width transition (BANKGO style) */}
      <aside
        data-collapsed={collapsed ? "true" : "false"}
        data-sidebar="dark"
        className="fixed left-0 top-0 z-[100] flex h-full flex-col border-r border-dashboard-border/60 bg-dashboard-sidebar"
        style={{
          width: sidebarWidth,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "1px 0 20px -4px rgba(0,0,0,0.08)",
        }}
      >
        {/* Toggle button — BANKGO: subtle hover (bg + text only), no emerald glow */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="sidebar-toggle absolute -right-[14px] top-[calc(var(--topbar-height)/2-14px)] z-10 flex h-7 w-7 items-center justify-center rounded-full border border-dashboard-border bg-dashboard-card text-dashboard-text-muted shadow-md transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-dashboard-card-hover hover:text-dashboard-text focus:outline-none"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Sidebar content — overflow hidden so wide content clips at narrow width */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {sidebar}
        </div>
      </aside>

      {/* Main content — margin-left mirrors sidebar width */}
      <div
        className="flex min-h-screen flex-col"
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {stripeTestBanner}
        <DashboardNavBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-dashboard">
          {children}
        </main>
      </div>
    </div>
  );
}
