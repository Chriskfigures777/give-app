import Link from "next/link";
import { Suspense } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardLayoutClient } from "./dashboard-layout-client";
import { DashboardThemeProvider } from "@/components/dashboard-theme-provider";
import { DashboardThemeScript } from "@/components/dashboard-theme-script";
import { BrandMark } from "@/components/brand-mark";
import { isStripeTestMode } from "@/lib/stripe/constants";

function DashboardSidebarFallback() {
  return (
    <>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl bg-dashboard-card-hover/50"
            />
          ))}
        </div>
      </nav>
      <div className="shrink-0 border-t border-dashboard-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-dashboard-card px-4 py-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-dashboard-card-hover" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-4 w-24 animate-pulse rounded bg-dashboard-card-hover" />
            <div className="h-3 w-16 animate-pulse rounded bg-dashboard-card-hover/70" />
          </div>
        </div>
      </div>
    </>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebar = (
    <>
      {/* Brand */}
      <div className="shrink-0 px-4 pt-5 pb-4">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 rounded-xl py-2 px-2 -ml-1 transition-all duration-200 hover:bg-dashboard-card-hover/50"
        >
          <BrandMark
            className="h-9 w-9 shrink-0 drop-shadow-[0_6px_10px_rgba(16,185,129,0.2)] transition-transform duration-200 group-hover:scale-105"
            id="dash"
          />
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-dashboard-text-muted">Dashboard</span>
        </Link>
        <Link
          href="/feed"
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-dashboard-text-muted hover:bg-dashboard-card-hover/50 hover:text-dashboard-text transition-all duration-200 -ml-1"
        >
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Homepage
        </Link>
      </div>

      {/* Nav + user section - async, streamed with Suspense */}
      <Suspense fallback={<DashboardSidebarFallback />}>
        <DashboardSidebar />
      </Suspense>
    </>
  );

  const stripeTestBanner = isStripeTestMode() ? (
    <div className="shrink-0 border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-200">
      You&apos;re in Stripe test mode. No real payments will be processed.
    </div>
  ) : null;

  return (
    <>
      <DashboardThemeScript />
      <DashboardThemeProvider>
        <DashboardLayoutClient sidebar={sidebar} stripeTestBanner={stripeTestBanner}>
          {children}
        </DashboardLayoutClient>
      </DashboardThemeProvider>
    </>
  );
}
