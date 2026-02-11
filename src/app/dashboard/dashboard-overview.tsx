"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DashboardWelcomeBanner } from "./dashboard-welcome-banner";
import type { DonationRow, OrganizationRow } from "./dashboard-types";

// Flatten donation for client (match New Dashbord field names where applicable)
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
    email: "—", // organizations table has no email; use website_url in future if needed
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

const CHART_COLORS = ["#11B5AE", "#4046CA", "#F68512", "#DE3C82", "#7E84FA", "#72E06A"];
const LINE_COLOR = "rgba(181, 191, 218, 1)";

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

type Props = {
  donations: DonationRow[];
  organizations: OrganizationRow[];
  isPlatformAdmin: boolean;
  userName?: string | null;
  needsVerification?: boolean;
};

const CARD_STAGGER = 0.08;

export function DashboardOverview({ donations: rawDonations, organizations: rawOrgs, isPlatformAdmin, userName, needsVerification }: Props) {
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [orgFilter, setOrgFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewDonation, setViewDonation] = useState<DonationFlat | null>(null);
  const [addOrgOpen, setAddOrgOpen] = useState(false);

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
    <div className="space-y-6 p-2 sm:p-4">
      {needsVerification && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-sm font-medium text-amber-800">Actions required</p>
          <p className="mt-1 text-sm text-amber-700">
            Complete verification to receive payouts. Finish your organization details, identity, and banking.
          </p>
          <Button asChild size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700">
            <Link href="/dashboard/connect/verify">Complete verification</Link>
          </Button>
        </motion.div>
      )}
      <DashboardWelcomeBanner userName={userName ?? null} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Give Platform Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          {isPlatformAdmin && (
            <Button onClick={() => setAddOrgOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              Add Org
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/settings">Settings</Link>
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 + CARD_STAGGER }}
        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Start date</label>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">End date</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Organization</label>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All organizations</option>
              {organizationFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Active organizations",
            value: `${activeOrganizations} orgs`,
            sub: "Currently active organizations",
            icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
            color: "bg-violet-500/10 text-violet-600",
            delay: 0.2,
          },
          {
            label: "Total Givers",
            value: `${totalDonors} givers`,
            sub: "Unique givers in selection",
            icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
            color: "bg-emerald-500/10 text-emerald-600",
            delay: 0.28,
          },
          {
            label: "Total Donations",
            value: formatCurrency(totalDonationsCents),
            sub: "All-time total (filtered)",
            icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "bg-amber-500/10 text-amber-600",
            delay: 0.36,
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: card.delay, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{card.sub}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.color}`}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Donation trends chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.44 }}
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
      >
        <h3 className="mb-4 text-base font-bold text-slate-900">Donation Trends</h3>
        <div className="h-64">
          {donationTrends.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">No donation data in range</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donationTrends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} stroke="#64748b" />
                <Tooltip formatter={(v: number) => [formatCurrency(Math.round(v * 100)), "Total"]} labelFormatter={(l) => `Date: ${l}`} />
                <Line type="monotone" dataKey="total" name="Total donations" stroke="#0d9488" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Distribution by organization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.52 }}
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
      >
        <h3 className="mb-4 text-base font-bold text-slate-900">Distribution by Organization</h3>
        <div className="h-64">
          {orgDistribution.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orgDistribution}
                  dataKey="total"
                  nameKey="org"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  label={({ org, percent }) => `${org} ${(percent * 100).toFixed(0)}%`}
                >
                  {orgDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(Math.round(v * 100))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Organizations table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm"
      >
        <div className="border-b border-slate-200/80 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">Organizations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-700">ID</th>
                <th className="text-left p-3 font-semibold text-slate-700">Organization</th>
                <th className="text-left p-3 font-semibold text-slate-700">Slug</th>
                <th className="text-left p-3 font-semibold text-slate-700">Type</th>
                <th className="text-left p-3 font-semibold text-slate-700">Status</th>
                <th className="text-right p-3 font-semibold text-slate-700">Total donations</th>
                <th className="text-left p-3 font-semibold text-slate-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrganizations.map((o) => (
                <tr key={o.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/50">
                  <td className="p-3 font-mono text-slate-500">{o.id.slice(0, 8)}</td>
                  <td className="p-3 font-medium text-slate-900">{o.name}</td>
                  <td className="p-3 text-slate-500">{o.slug}</td>
                  <td className="p-3 text-slate-600">{o.type ?? "—"}</td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${o.status === "active" ? "bg-emerald-500/15 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-slate-900">{formatCurrency(Math.round(o.totalDonations * 100))}</td>
                  <td className="p-3 text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrganizations.length === 0 && (
          <p className="p-6 text-center text-slate-500">No organizations found.</p>
        )}
      </motion.div>

      {/* Recent Donations table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.68 }}
        className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm"
      >
        <div className="border-b border-slate-200/80 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">Recent Donations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-700">Date</th>
                <th className="text-left p-3 font-semibold text-slate-700">Endowment</th>
                <th className="text-left p-3 font-semibold text-slate-700">Campaign</th>
                <th className="text-left p-3 font-semibold text-slate-700">Status</th>
                <th className="text-left p-3 font-semibold text-slate-700">Currency</th>
                <th className="text-right p-3 font-semibold text-slate-700">Amount</th>
                <th className="text-left p-3 font-semibold text-slate-700">Email</th>
                <th className="text-left p-3 font-semibold text-slate-700">Giver</th>
                <th className="text-left p-3 font-semibold text-slate-700">Organization</th>
                <th className="text-right p-3 font-semibold text-slate-700">Donation ID</th>
                <th className="text-left p-3 font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.slice(0, 50).map((d) => (
                <tr key={d.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/50">
                  <td className="p-3 text-slate-500">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="p-3 text-slate-600">{d.endowment ?? "—"}</td>
                  <td className="p-3 text-slate-600">{d.campaign ?? "—"}</td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${d.status === "succeeded" ? "bg-emerald-500/15 text-emerald-700" : d.status === "pending" ? "bg-amber-500/15 text-amber-700" : "bg-red-500/15 text-red-700"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{d.currency}</td>
                  <td className="p-3 text-right font-medium text-slate-900">{d.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-slate-500">{d.donorEmail ?? "—"}</td>
                  <td className="p-3 text-slate-900">{d.donorName ?? "—"}</td>
                  <td className="p-3 text-slate-600">{d.orgName}</td>
                  <td className="p-3 text-right font-mono text-slate-500">{d.id.slice(0, 8)}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={() => setViewDonation(d)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDonations.length === 0 && (
          <p className="p-6 text-center text-slate-500">No donations found.</p>
        )}
      </motion.div>

      {/* View Donation modal */}
      <Dialog open={!!viewDonation} onOpenChange={(open) => !open && setViewDonation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
          </DialogHeader>
          {viewDonation && (
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{viewDonation.createdAt ? new Date(viewDonation.createdAt).toLocaleString() : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>{formatCurrency(viewDonation.amount_cents)} {viewDonation.currency}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{viewDonation.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Giver</span><span>{viewDonation.donorName ?? viewDonation.donorEmail ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{viewDonation.donorEmail ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Organization</span><span>{viewDonation.orgName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Campaign</span><span>{viewDonation.campaign ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Endowment</span><span>{viewDonation.endowment ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Donation ID</span><span className="font-mono">{viewDonation.id}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDonation(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Organization modal - placeholder; can wire to API later */}
      <Dialog open={addOrgOpen} onOpenChange={setAddOrgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Organization</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            To add an organization, go to Settings or use the platform admin flow. This modal can be wired to an API later.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOrgOpen(false)}>Cancel</Button>
            <Button asChild>
              <Link href="/dashboard/settings" onClick={() => setAddOrgOpen(false)}>Open Settings</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
