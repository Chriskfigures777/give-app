"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Receipt, Wallet, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export type DonationRow = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  donor_name: string | null;
  donor_email: string | null;
  created_at: string | null;
  organization_id: string | null;
  organizations: { name?: string; slug?: string } | null;
  donation_campaigns: { name?: string } | null;
};

type Props = {
  donations: DonationRow[];
  orgId: string | null;
  isPlatformAdmin: boolean;
};

export function DonationsRealtimeClient({ donations, orgId, isPlatformAdmin }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("donations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "donations",
          ...(orgId && !isPlatformAdmin ? { filter: `organization_id=eq.${orgId}` } : {}),
        },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, isPlatformAdmin, router]);

  const totalCents = donations.filter((d) => d.status === "succeeded").reduce((s, d) => s + d.amount_cents, 0);
  const totalDonors = new Set(donations.map((d) => d.donor_email ?? d.donor_name).filter(Boolean)).size;
  const succeededCount = donations.filter((d) => d.status === "succeeded").length;

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="dashboard-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Donations</h1>
        <p className="mt-1 text-slate-600">All donations received by your organization.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-fade-in dashboard-fade-in-delay-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total received</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">${(totalCents / 100).toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-2.5">
              <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="dashboard-fade-in dashboard-fade-in-delay-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total givers</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totalDonors}</p>
            </div>
            <div className="rounded-xl bg-violet-500/10 p-2.5">
              <Users className="h-6 w-6 text-violet-600" />
            </div>
          </div>
        </div>
        <div className="dashboard-fade-in dashboard-fade-in-delay-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Successful</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{succeededCount}</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-2.5">
              <Receipt className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-fade-in dashboard-fade-in-delay-4 rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-200/80 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">All Donations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-700">Amount</th>
                <th className="text-left p-3 font-semibold text-slate-700">Giver</th>
                <th className="text-left p-3 font-semibold text-slate-700">Organization</th>
                <th className="text-left p-3 font-semibold text-slate-700">Campaign</th>
                <th className="text-left p-3 font-semibold text-slate-700">Status</th>
                <th className="text-left p-3 font-semibold text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/50">
                  <td className="p-3 text-right font-medium text-slate-900">
                    ${(Number(d.amount_cents) / 100).toFixed(2)} {d.currency}
                  </td>
                  <td className="p-3 text-slate-900">
                    {d.donor_name ?? d.donor_email ?? "—"}
                  </td>
                  <td className="p-3 text-slate-600">
                    {(d.organizations as { name?: string; slug?: string } | null)?.name ?? "—"}
                  </td>
                  <td className="p-3 text-slate-600">
                    {(d.donation_campaigns as { name?: string } | null)?.name ?? "—"}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${d.status === "succeeded" ? "bg-emerald-500/15 text-emerald-700" : d.status === "pending" ? "bg-amber-500/15 text-amber-700" : "bg-red-500/15 text-red-700"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">
                    {d.created_at
                      ? new Date(d.created_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {donations.length === 0 && (
          <EmptyState
            title="No donations yet"
            description="Donations will appear here once they come in."
            variant="donations"
          />
        )}
      </div>
    </div>
  );
}
