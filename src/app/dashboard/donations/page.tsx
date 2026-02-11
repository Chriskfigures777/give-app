import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

type DonationRow = {
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

export default async function DonationsPage() {
  const { profile, supabase } = await requireAuth();
  const isPlatformAdmin = profile?.role === "platform_admin";
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  const query = supabase
    .from("donations")
    .select(`
      id, amount_cents, currency, status, donor_name, donor_email, created_at,
      organization_id,
      organizations(name, slug),
      donation_campaigns(name)
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!isPlatformAdmin && orgId) {
    query.eq("organization_id", orgId);
  }

  const { data: donationsData } = await query;
  const donations = (donationsData ?? []) as DonationRow[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Donations</h1>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Amount</th>
              <th className="text-left p-3 font-medium">Giver</th>
              <th className="text-left p-3 font-medium">Organization</th>
              <th className="text-left p-3 font-medium">Campaign</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="p-3">
                  ${(Number(d.amount_cents) / 100).toFixed(2)} {d.currency}
                </td>
                <td className="p-3">
                  {d.donor_name ?? d.donor_email ?? "—"}
                </td>
                <td className="p-3">
                  {(d.organizations as { name?: string; slug?: string } | null)?.name ?? "—"}
                </td>
                <td className="p-3">
                  {(d.donation_campaigns as { name?: string } | null)?.name ?? "—"}
                </td>
                <td className="p-3">{d.status}</td>
                <td className="p-3 text-muted-foreground">
                  {d.created_at
                    ? new Date(d.created_at).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {donations.length === 0 && (
          <p className="p-6 text-muted-foreground text-center">No donations yet.</p>
        )}
      </div>
    </div>
  );
}
