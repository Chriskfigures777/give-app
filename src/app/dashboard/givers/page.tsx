import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { Users, UserCircle, Heart } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { AddMissionaryButton } from "./add-missionary-button";
import { CreateMissionaryForm } from "./create-missionary-form";

export default async function GiversPage() {
  const { profile, supabase } = await requireAuth();
  const isPlatformAdmin = profile?.role === "platform_admin";
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!isPlatformAdmin && !orgId) redirect("/dashboard");

  const query = supabase
    .from("donations")
    .select("id, amount_cents, status, donor_email, donor_name, created_at")
    .eq("status", "succeeded")
    .order("created_at", { ascending: false });

  if (!isPlatformAdmin && orgId) {
    query.eq("organization_id", orgId);
  }

  const { data: donationsData } = await query;

  type DonationRow = {
    id: string;
    amount_cents: number;
    status: string;
    donor_email: string | null;
    donor_name: string | null;
    created_at: string | null;
  };
  const donations = (donationsData ?? []) as DonationRow[];

  type GiverRow = {
    key: string;
    donorEmail: string | null;
    donorName: string | null;
    totalCents: number;
    donationCount: number;
    lastDonationAt: string | null;
  };

  const giverMap = new Map<string, GiverRow>();
  for (const d of donations) {
    const key = (d.donor_email ?? "").trim() || `name:${(d.donor_name ?? "").trim()}` || `id:${d.id}`;
    const existing = giverMap.get(key);
    const cents = Number(d.amount_cents);
    if (existing) {
      existing.totalCents += cents;
      existing.donationCount += 1;
      if ((d.created_at ?? "") > (existing.lastDonationAt ?? "")) {
        existing.lastDonationAt = d.created_at;
      }
    } else {
      giverMap.set(key, {
        key,
        donorEmail: d.donor_email ?? null,
        donorName: d.donor_name ?? null,
        totalCents: cents,
        donationCount: 1,
        lastDonationAt: d.created_at,
      });
    }
  }

  const givers = Array.from(giverMap.values()).sort(
    (a, b) => b.totalCents - a.totalCents
  );

  const totalCents = givers.reduce((s, g) => s + g.totalCents, 0);
  const totalGifts = givers.reduce((s, g) => s + g.donationCount, 0);

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(cents / 100);
  }

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="dashboard-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Givers</h1>
          <p className="mt-1 text-slate-600">
            People who have given to your organization. Givers are identified by email when available.
          </p>
        </div>
        <div className="shrink-0">
          <CreateMissionaryForm />
        </div>
      </div>

      {/* Summary cards */}
      {givers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="dashboard-fade-in dashboard-fade-in-delay-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total givers</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{givers.length}</p>
              </div>
              <div className="rounded-xl bg-violet-500/10 p-2.5">
                <Users className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </div>
          <div className="dashboard-fade-in dashboard-fade-in-delay-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total received</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totalCents)}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <Heart className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="dashboard-fade-in dashboard-fade-in-delay-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total gifts</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{totalGifts}</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5">
                <UserCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm ${givers.length > 0 ? "dashboard-fade-in dashboard-fade-in-delay-4" : "dashboard-fade-in dashboard-fade-in-delay-1"}`}>
        <div className="border-b border-slate-200/80 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Giver list</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-700">Giver</th>
                <th className="text-left p-3 font-semibold text-slate-700">Email</th>
                <th className="text-right p-3 font-semibold text-slate-700">Total given</th>
                <th className="text-right p-3 font-semibold text-slate-700">Gifts</th>
                <th className="text-left p-3 font-semibold text-slate-700">Last donation</th>
                <th className="text-center p-3 font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {givers.map((row) => (
                <tr key={row.key} className="border-t border-slate-100 transition-colors hover:bg-slate-50/50">
                  <td className="p-3 font-medium text-slate-900">
                    {row.donorName ?? (row.donorEmail ? "—" : "Anonymous")}
                  </td>
                  <td className="p-3 text-slate-500">
                    {row.donorEmail ?? "—"}
                  </td>
                  <td className="p-3 text-right font-medium text-slate-900">
                    {formatCurrency(row.totalCents)}
                  </td>
                  <td className="p-3 text-right text-slate-600">{row.donationCount}</td>
                  <td className="p-3 text-slate-500">
                    {row.lastDonationAt
                      ? new Date(row.lastDonationAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3 text-center">
                    {row.donorEmail ? (
                      <AddMissionaryButton giverEmail={row.donorEmail} giverName={row.donorName} />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {givers.length === 0 && (
          <EmptyState
            title="No givers yet"
            description="Share your give link so people can give."
            variant="givers"
          />
        )}
      </div>
    </div>
  );
}
