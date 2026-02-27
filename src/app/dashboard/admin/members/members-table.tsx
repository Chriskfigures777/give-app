"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";

type User = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  organization_id: string | null;
  preferred_organization_id: string | null;
  is_missionary: boolean | null;
  missionary_sponsor_org_id: string | null;
  created_at: string | null;
};

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  donor: { label: "Donor", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  missionary: { label: "Missionary", className: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300" },
  organization_admin: { label: "Non-Profit", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  platform_admin: { label: "Platform Admin", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
};

export function MembersTable({ users, activeTab }: { users: User[]; activeTab: string }) {
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Search bar */}
      <div className="px-5 py-4 border-b border-dashboard-border">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 py-2 pl-9 pr-4 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-16 text-center text-sm text-dashboard-text-muted">
          {search ? "No members match your search." : "No members in this category."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dashboard-border bg-dashboard-card-hover/30">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Joined</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border">
              {filtered.map((user) => {
                const badge = ROLE_BADGES[user.role] ?? { label: user.role, className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" };
                const orgId = user.organization_id ?? user.preferred_organization_id ?? user.missionary_sponsor_org_id;
                const joined = user.created_at
                  ? new Date(user.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                  : "—";
                return (
                  <tr key={user.id} className="hover:bg-dashboard-card-hover/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-dashboard-text">
                      {user.full_name || <span className="text-dashboard-text-muted italic">No name</span>}
                      {user.is_missionary && user.role !== "missionary" && (
                        <span className="ml-2 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                          Missionary
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-dashboard-text-muted">{user.email || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-dashboard-text-muted tabular-nums">{joined}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {orgId && (
                          <Link
                            href={`/dashboard/admin/organizations/${orgId}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-1.5 text-xs font-medium text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Org
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 text-xs text-dashboard-text-muted border-t border-dashboard-border">
            Showing {filtered.length} of {users.length} {activeTab === "all" ? "members" : activeTab}
          </div>
        </div>
      )}
    </div>
  );
}
