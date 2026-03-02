"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { DonationTrendsChart, OrgDistributionChart } from "./dashboard-charts";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DashboardWelcomeBanner } from "./dashboard-welcome-banner";
import { DashboardGoalsOverview } from "./dashboard-goals-overview";
import type { DonationRow, OrganizationRow } from "./dashboard-types";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Download,
  Plus,
  Filter,
  X,
  BarChart3,
  PieChart,
  Eye,
} from "lucide-react";

function flattenDonation(d: DonationRow) {
  const orgName = d.organizations?.name ?? (d.organization_id ? `Org ${d.organization_id}` : "—");
  return {
    id: d.id,
    donationId: d.id,
    amount_cents: d.amount_cents,
    amount: Number(d.amount_cents) / 100,
    status: d.status,
    createdAt: d.created_at,
    organization_id: d.organization_id,
    orgName,
    donorEmail: d.donor_email ?? null,
    donorName: d.donor_name ?? null,
    currency: d.currency,
    campaign: (d.donation_campaigns as { name?: string } | null)?.name ?? null,
    endowment: (d.endowment_funds as { name?: string } | null)?.name ?? null,
  };
}

type DonationFlat = ReturnType<typeof flattenDonation>;

function buildOrgFlat(
  o: OrganizationRow,
  totalDonations: number
): { id: string; name: string; slug: string; email: string; type: string | null; status: string; totalDonations: number; createdAt: string | null } {
  return {
    id: o.id,
    name: o.name,
    slug: o.slug,
    email: "—",
    type: o.org_type ?? null,
    status: o.onboarding_completed ? "active" : "inactive",
    totalDonations,
    createdAt: o.created_at,
  };
}

const STATUS_OPTIONS = [
  { label: "Succeeded", value: "succeeded" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(cents / 100);
}

function exportToCsv<T extends Record<string, unknown>>(rows: T[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type CampaignRow = {
  id: string;
  name: string;
  description: string | null;
  goal_amount_cents: number | null;
  current_amount_cents: number | null;
  goal_deadline: string | null;
  created_at: string | null;
  is_active: boolean | null;
};

type Props = {
  donations: DonationRow[];
  organizations: OrganizationRow[];
  campaigns?: CampaignRow[];
  isPlatformAdmin: boolean;
  userName?: string | null;
  needsVerification?: boolean;
};

export function DashboardOverview({ donations: rawDonations, organizations: rawOrgs, campaigns = [], isPlatformAdmin, userName, needsVerification }: Props) {
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [orgFilter, setOrgFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewDonation, setViewDonation] = useState<DonationFlat | null>(null);
  const [addOrgOpen, setAddOrgOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const donations: DonationFlat[] = useMemo(() => rawDonations.map(flattenDonation), [rawDonations]);

  const orgTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of donations) {
      if (d.status !== "succeeded") continue;
      const key = d.organization_id ?? "unknown";
      map[key] = (map[key] ?? 0) + d.amount_cents;
    }
    return map;
  }, [donations]);

  const organizationsWithTotals = useMemo(() => {
    return rawOrgs.map((o) => buildOrgFlat(o, (orgTotals[o.id] ?? 0) / 100));
  }, [rawOrgs, orgTotals]);

  const organizationFilterOptions = useMemo(
    () => rawOrgs.map((o) => ({ label: o.name, value: o.id })),
    [rawOrgs]
  );

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      if (orgFilter && d.organization_id !== orgFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (dateStart && d.createdAt) {
        const day = d.createdAt.slice(0, 10);
        if (day < dateStart) return false;
      }
      if (dateEnd && d.createdAt) {
        const day = d.createdAt.slice(0, 10);
        if (day > dateEnd) return false;
      }
      return true;
    });
  }, [donations, orgFilter, statusFilter, dateStart, dateEnd]);

  const filteredOrganizations = useMemo(() => {
    if (!orgFilter) return organizationsWithTotals;
    return organizationsWithTotals.filter((o) => o.id === orgFilter);
  }, [organizationsWithTotals, orgFilter]);

  const activeOrganizations = useMemo(
    () => organizationsWithTotals.filter((o) => o.status === "active").length,
    [organizationsWithTotals]
  );

  const totalDonationsCents = useMemo(
    () => filteredDonations.filter((d) => d.status === "succeeded").reduce((s, d) => s + d.amount_cents, 0),
    [filteredDonations]
  );

  const totalDonors = useMemo(
    () => new Set(filteredDonations.map((d) => d.donorEmail).filter(Boolean)).size,
    [filteredDonations]
  );

  const donationTrends = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const d of filteredDonations) {
      if (d.status !== "succeeded") continue;
      const day = d.createdAt?.slice(0, 10) ?? "";
      if (!day) continue;
      byDate[day] = (byDate[day] ?? 0) + d.amount_cents / 100;
    }
    return Object.entries(byDate)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredDonations]);

  const orgDistribution = useMemo(() => {
    const byOrg: Record<string, number> = {};
    for (const d of filteredDonations) {
      if (d.status !== "succeeded") continue;
      const key = d.orgName;
      byOrg[key] = (byOrg[key] ?? 0) + d.amount_cents / 100;
    }
    return Object.entries(byOrg).map(([org, total]) => ({ org, total }));
  }, [filteredDonations]);

  const hasActiveFilters = dateStart || dateEnd || orgFilter || statusFilter;

  const clearFilters = useCallback(() => {
    setDateStart("");
    setDateEnd("");
    setOrgFilter("");
    setStatusFilter("");
  }, []);

  const handleExport = useCallback(() => {
    exportToCsv(
      filteredDonations.map((d) => ({
        id: d.id,
        date: d.createdAt,
        amount: d.amount,
        currency: d.currency,
        status: d.status,
        donorEmail: d.donorEmail,
        donorName: d.donorName,
        orgName: d.orgName,
        campaign: d.campaign,
        endowment: d.endowment,
      })),
      "donations-export.csv"
    );
  }, [filteredDonations]);

  return (
    <div className="space-y-6 p-2 sm:p-4 max-w-[1400px] mx-auto">
      {needsVerification && (
        <div className="dashboard-fade-in rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:border-amber-700/40 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-800/40">
              <ArrowUpRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Actions required</p>
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300/80">
                Complete verification to receive payouts. Finish your organization details, identity, and banking.
              </p>
              <Button asChild size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                <Link href="/dashboard/connect/verify">Complete verification</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <DashboardWelcomeBanner userName={userName ?? null} />

      {/* Header */}
      <div className="dashboard-fade-in dashboard-fade-in-delay-1 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-dashboard-text">Overview</h1>
          <p className="text-sm text-dashboard-text-muted mt-0.5">
            {filteredDonations.length} donation{filteredDonations.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 border ${
              showFilters || hasActiveFilters
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "border-dashboard-border bg-dashboard-card text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                {[dateStart, dateEnd, orgFilter, statusFilter].filter(Boolean).length}
              </span>
            )}
          </button>
          {isPlatformAdmin && (
            <Button onClick={() => setAddOrgOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 rounded-xl shadow-sm">
              <Plus className="h-4 w-4" />
              Add Org
            </Button>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-sm font-medium text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="dashboard-fade-in rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dashboard-text">Filter donations</h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-dashboard-text-muted hover:text-dashboard-text transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">Start date</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full rounded-xl border border-dashboard-input-border bg-dashboard-input px-3 py-2.5 text-sm text-dashboard-text shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">End date</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full rounded-xl border border-dashboard-input-border bg-dashboard-input px-3 py-2.5 text-sm text-dashboard-text shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">Organization</label>
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="w-full rounded-xl border border-dashboard-input-border bg-dashboard-input px-3 py-2.5 text-sm text-dashboard-text shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                <option value="">All organizations</option>
                {organizationFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-dashboard-input-border bg-dashboard-input px-3 py-2.5 text-sm text-dashboard-text shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Campaign goals */}
      {campaigns.length > 0 && <DashboardGoalsOverview campaigns={campaigns} />}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Organizations",
            value: activeOrganizations.toString(),
            sub: "Active orgs",
            icon: Building2,
            gradient: "from-violet-500/10 to-purple-500/10",
            iconBg: "bg-violet-100 dark:bg-violet-500/20",
            iconColor: "text-violet-600 dark:text-violet-400",
            delay: "dashboard-fade-in-delay-2",
          },
          {
            label: "Total Givers",
            value: totalDonors.toString(),
            sub: "Unique givers",
            icon: Users,
            gradient: "from-blue-500/10 to-cyan-500/10",
            iconBg: "bg-blue-100 dark:bg-blue-500/20",
            iconColor: "text-blue-600 dark:text-blue-400",
            delay: "dashboard-fade-in-delay-3",
          },
          {
            label: "Total Donations",
            value: formatCurrency(totalDonationsCents),
            sub: "All-time (filtered)",
            icon: DollarSign,
            gradient: "from-emerald-500/10 to-teal-500/10",
            iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            delay: "dashboard-fade-in-delay-4",
          },
          {
            label: "Avg. Donation",
            value: filteredDonations.filter((d) => d.status === "succeeded").length > 0
              ? formatCurrency(Math.round(totalDonationsCents / filteredDonations.filter((d) => d.status === "succeeded").length))
              : "$0.00",
            sub: "Per transaction",
            icon: TrendingUp,
            gradient: "from-amber-500/10 to-orange-500/10",
            iconBg: "bg-amber-100 dark:bg-amber-500/20",
            iconColor: "text-amber-600 dark:text-amber-400",
            delay: "dashboard-fade-in-delay-5",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`dashboard-fade-in ${card.delay} kpi-card rounded-2xl border border-dashboard-border bg-gradient-to-br ${card.gradient} bg-dashboard-card p-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-dashboard-text">{card.value}</p>
                  <p className="mt-1 text-xs text-dashboard-text-muted">{card.sub}</p>
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="dashboard-fade-in dashboard-fade-in-delay-6 rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-dashboard-text-muted" />
            <h3 className="text-sm font-semibold text-dashboard-text">Donation Trends</h3>
          </div>
          <DonationTrendsChart data={donationTrends} />
        </div>
        <div className="dashboard-fade-in dashboard-fade-in-delay-7 rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-4 w-4 text-dashboard-text-muted" />
            <h3 className="text-sm font-semibold text-dashboard-text">Distribution by Organization</h3>
          </div>
          <OrgDistributionChart data={orgDistribution} />
        </div>
      </div>

      {/* Organizations table */}
      <div className="dashboard-fade-in dashboard-fade-in-delay-8 rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-dashboard-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-dashboard-text-muted" />
            <h3 className="text-sm font-semibold text-dashboard-text">Organizations</h3>
            <span className="text-xs text-dashboard-text-muted">({filteredOrganizations.length})</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Slug</th>
                <th>Type</th>
                <th>Status</th>
                <th className="text-right">Total donations</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrganizations.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {o.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-dashboard-text">{o.name}</span>
                    </div>
                  </td>
                  <td className="text-dashboard-text-muted font-mono text-xs">{o.slug}</td>
                  <td className="text-dashboard-text-muted">{o.type ?? "—"}</td>
                  <td>
                    <span className={`status-badge ${o.status === "active" ? "status-badge-success" : "status-badge-neutral"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="text-right font-medium text-dashboard-text tabular-nums">{formatCurrency(Math.round(o.totalDonations * 100))}</td>
                  <td className="text-dashboard-text-muted">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrganizations.length === 0 && (
          <EmptyState title="No organizations found" description="Try adjusting your filters or add an organization." variant="organizations" />
        )}
      </div>

      {/* Recent Donations table */}
      <div className="dashboard-fade-in dashboard-fade-in-delay-9 rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-dashboard-border px-5 py-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-dashboard-text-muted" />
            <h3 className="text-sm font-semibold text-dashboard-text">Recent Donations</h3>
            <span className="text-xs text-dashboard-text-muted">({filteredDonations.length})</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Giver</th>
                <th>Organization</th>
                <th>Campaign</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.slice(0, 50).map((d) => (
                <tr key={d.id}>
                  <td className="text-dashboard-text-muted text-xs tabular-nums">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-dashboard-text">{d.donorName ?? "Anonymous"}</span>
                      <span className="text-xs text-dashboard-text-muted">{d.donorEmail ?? ""}</span>
                    </div>
                  </td>
                  <td className="text-dashboard-text-muted">{d.orgName}</td>
                  <td className="text-dashboard-text-muted">{d.campaign ?? "—"}</td>
                  <td>
                    <span className={`status-badge ${
                      d.status === "succeeded" ? "status-badge-success" : d.status === "pending" ? "status-badge-warning" : "status-badge-error"
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="text-right font-semibold text-dashboard-text tabular-nums">{formatCurrency(d.amount_cents)}</td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => setViewDonation(d)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDonations.length === 0 && (
          <EmptyState title="No donations found" description="Donations will appear here once they come in." variant="donations" />
        )}
      </div>

      {/* View Donation modal */}
      <Dialog open={!!viewDonation} onOpenChange={(open) => !open && setViewDonation(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Donation Details
            </DialogTitle>
          </DialogHeader>
          {viewDonation && (
            <div className="grid gap-3 text-sm">
              {[
                { label: "Date", value: viewDonation.createdAt ? new Date(viewDonation.createdAt).toLocaleString() : "—" },
                { label: "Amount", value: `${formatCurrency(viewDonation.amount_cents)} ${viewDonation.currency}` },
                { label: "Status", value: viewDonation.status },
                { label: "Giver", value: viewDonation.donorName ?? viewDonation.donorEmail ?? "—" },
                { label: "Email", value: viewDonation.donorEmail ?? "—" },
                { label: "Organization", value: viewDonation.orgName },
                { label: "Campaign", value: viewDonation.campaign ?? "—" },
                { label: "Endowment", value: viewDonation.endowment ?? "—" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-2 border-b border-dashboard-border last:border-0">
                  <span className="text-dashboard-text-muted text-xs font-medium uppercase tracking-wider">{row.label}</span>
                  <span className="text-sm font-medium text-dashboard-text">{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-dashboard-text-muted text-xs font-medium uppercase tracking-wider">Donation ID</span>
                <span className="font-mono text-xs text-dashboard-text-muted">{viewDonation.id}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDonation(null)} className="rounded-xl">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Organization modal */}
      <Dialog open={addOrgOpen} onOpenChange={setAddOrgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Add New Organization
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            To add an organization, go to Settings or use the platform admin flow.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOrgOpen(false)} className="rounded-xl">Cancel</Button>
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/settings" onClick={() => setAddOrgOpen(false)}>Open Settings</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
