"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardNavBar } from "@/components/dashboard-nav-bar";

const AUTO_COLLAPSE_PATHS = ["/dashboard/website-form", "/dashboard/custom-forms"];

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

  // Sidebar always starts open — no animation on initial load
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Skip auto-collapse on the very first mount so there is no drawer animation on page load
  const initialLoadRef = useRef(true);
  // Remember whether we were on an auto-collapse page so we only
  // animate on the *transition* into / out of one
  const wasAutoCollapseRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-collapse / expand only on actual *navigation* (not initial load)
  useEffect(() => {
    if (!mounted) return;

    if (initialLoadRef.current) {
      // First mount — just record current state, don't animate
      initialLoadRef.current = false;
      wasAutoCollapseRef.current = isAutoCollapsePage;
      return;
    }

    if (isAutoCollapsePage && !wasAutoCollapseRef.current) {
      // Navigated INTO customization → smoothly collapse
      setIsOpen(false);
    } else if (!isAutoCollapsePage && wasAutoCollapseRef.current) {
      // Navigated OUT of customization → smoothly expand
      setIsOpen(true);
    }

    wasAutoCollapseRef.current = isAutoCollapsePage;
  }, [pathname, mounted, isAutoCollapsePage]);

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  // Before mount, always show sidebar (AnimatePresence initial={false} prevents flash)
  const sidebarOpen = mounted ? isOpen : true;

  const toggleButton =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div
            className={cn(
              "fixed top-1/2 -translate-y-1/2 z-[9999] pointer-events-auto transition-[left] duration-300 ease-out",
              sidebarOpen ? "left-[268px]" : "left-4"
            )}
          >
            <button
              type="button"
              onClick={toggle}
              className="group h-8 w-8 rounded-full shadow-lg border border-dashboard-border bg-dashboard-card hover:bg-dashboard-card-hover hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200 inline-flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 hover:shadow-xl hover:scale-105"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <motion.span
                animate={{ rotate: sidebarOpen ? 0 : 180 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="inline-flex"
              >
                <ChevronLeft className="h-4 w-4 text-dashboard-text-muted group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </motion.span>
            </button>
          </div>,
          document.body
        )
      : null;

  if (isFullScreenBuilder) {
    return (
      <div className="fixed inset-0 h-screen w-screen overflow-y-auto overflow-x-hidden bg-white">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-dashboard">
      {toggleButton}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="sticky top-0 h-screen shrink-0 flex flex-col border-r border-dashboard-border/60 bg-dashboard-sidebar overflow-hidden"
            style={{
              boxShadow: "1px 0 16px -4px rgba(0,0,0,0.06)",
            }}
          >
            {sidebar}
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="relative flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        {stripeTestBanner}
        <DashboardNavBar />
        <main
          className={cn(
            "flex-1 min-h-0 p-6 bg-dashboard min-w-0 overflow-x-hidden overflow-y-auto transition-[padding] duration-300",
            sidebarOpen ? "pl-8" : "pl-14"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
