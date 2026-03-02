"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, Globe } from "lucide-react";

type Org = {
  id: string;
  name: string | null;
  slug: string | null;
  org_type: string | null;
  city: string | null;
  state: string | null;
  member_count: number | null;
  website_url: string | null;
  stripe_connect_account_id: string | null;
  stripe_billing_customer_id?: string | null;
  created_at: string | null;
  plan?: string | null;
  plan_status?: string | null;
};

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  website: { label: "Website", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  growth: { label: "Growth", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  pro: { label: "Pro", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
};

const STATUS_BADGES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  trialing: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  past_due: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  canceled: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

export function OrgsTable({ orgs }: { orgs: Record<string, unknown>[] }) {
  const [search, setSearch] = useState("");

  const filtered = (orgs as Org[]).filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.name?.toLowerCase().includes(q) ||
      o.slug?.toLowerCase().includes(q) ||
      o.city?.toLowerCase().includes(q) ||
      o.org_type?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Search */}
      <div className="px-5 py-4 border-b border-dashboard-border">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted" />
          <input
            type="text"
            placeholder="Search orgs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 py-2 pl-9 pr-4 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-16 text-center text-sm text-dashboard-text-muted">
          {search ? "No organizations match your search." : "No organizations found."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dashboard-border bg-dashboard-card-hover/30">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Organization</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Location</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Members</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Created</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border">
              {filtered.map((org) => {
                const plan = org.plan ?? "free";
                const planBadge = PLAN_BADGES[plan] ?? PLAN_BADGES.free;
                const statusClass = org.plan_status ? STATUS_BADGES[org.plan_status] ?? "" : "";
                const created = org.created_at
                  ? new Date(org.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                  : "—";
                return (
                  <tr key={org.id} className="hover:bg-dashboard-card-hover/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-dashboard-text">{org.name || <span className="italic text-dashboard-text-muted">Unnamed</span>}</div>
                      <div className="text-xs text-dashboard-text-muted">/{org.slug}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadge.className}`}>
                          {planBadge.label}
                        </span>
                        {org.plan_status && (
                          <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass}`}>
                            {org.plan_status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-dashboard-text-muted">
                      {[org.city, org.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-dashboard-text-muted tabular-nums">
                      {org.member_count ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-dashboard-text-muted tabular-nums">{created}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {org.website_url && (
                          <a
                            href={org.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-1.5 text-xs font-medium text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
                          >
                            <Globe className="h-3 w-3" />
                            Site
                          </a>
                        )}
                        <Link
                          href={`/dashboard/admin/organizations/${org.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 text-xs text-dashboard-text-muted border-t border-dashboard-border">
            Showing {filtered.length} of {orgs.length} organizations
          </div>
        </div>
      )}
    </div>
  );
}
