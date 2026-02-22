"use client";

import Link from "next/link";
import { Link2, ArrowLeft } from "lucide-react";

export function DonationLinksComingSoon() {
  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto overflow-x-hidden">
      <div className="grid grid-cols-1 gap-6 px-4 py-6">
        <Link
          href="/dashboard/website-form"
          className="inline-flex items-center gap-2 text-dashboard-text-muted hover:text-dashboard-text text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customization
        </Link>
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Link2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-dashboard-text">
            Donation links
          </h1>
          <p className="mt-2 text-lg font-medium text-emerald-600 dark:text-emerald-400">
            Feature coming soon
          </p>
          <p className="mx-auto mt-4 max-w-md text-dashboard-text-muted">
            Create shareable links that split donations across multiple organizations. This feature is in development. For now, use the default form or embed cards to accept donations.
          </p>
        </div>
      </div>
    </div>
  );
}
