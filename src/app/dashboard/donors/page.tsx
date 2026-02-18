import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

export default async function DonorsPage() {
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

  const { data: donations } = await query;

  type DonationRow = { id: string; amount_cents: number; status: string; donor_email: string | null; donor_name: string | null; created_at: string | null };
  const donationList = (donations ?? []) as DonationRow[];

  type DonorRow = {
    key: string;
    donorEmail: string | null;
    donorName: string | null;
    totalCents: number;
    donationCount: number;
    lastDonationAt: string | null;
  };

  const donorMap = new Map<string, DonorRow>();
  for (const d of donationList) {
    const key = (d.donor_email ?? "").trim() || `name:${(d.donor_name ?? "").trim()}` || `id:${d.id}`;
    const existing = donorMap.get(key);
    const cents = Number(d.amount_cents);
    if (existing) {
      existing.totalCents += cents;
      existing.donationCount += 1;
      if ((d.created_at ?? "") > (existing.lastDonationAt ?? "")) {
        existing.lastDonationAt = d.created_at;
      }
    } else {
      donorMap.set(key, {
        key,
        donorEmail: d.donor_email ?? null,
        donorName: d.donor_name ?? null,
        totalCents: cents,
        donationCount: 1,
        lastDonationAt: d.created_at,
      });
    }
  }

  const donors = Array.from(donorMap.values()).sort(
    (a, b) => b.totalCents - a.totalCents
  );

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(cents / 100);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Donors</h1>
      <p className="text-muted-foreground">
        People who have given to your organization. Donors are identified by email when available.
      </p>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Donor</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-right p-3 font-medium">Total given</th>
              <th className="text-right p-3 font-medium">Gifts</th>
              <th className="text-left p-3 font-medium">Last donation</th>
            </tr>
          </thead>
          <tbody>
            {donors.map((row) => (
              <tr key={row.key} className="border-t border-border">
                <td className="p-3">
                  {row.donorName ?? (row.donorEmail ? "—" : "Anonymous")}
                </td>
                <td className="p-3 text-muted-foreground">
                  {row.donorEmail ?? "—"}
                </td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(row.totalCents)}
                </td>
                <td className="p-3 text-right">{row.donationCount}</td>
                <td className="p-3 text-muted-foreground">
                  {row.lastDonationAt
                    ? new Date(row.lastDonationAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {donors.length === 0 && (
          <p className="p-6 text-muted-foreground text-center">
            No donors yet. Share your give link so people can give.
          </p>
        )}
      </div>
    </div>
  );
}
