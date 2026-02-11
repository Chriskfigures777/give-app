import { requirePlatformAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EndowmentFundsAdmin } from "./endowment-funds-admin";

export default async function DashboardAdminPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data: endowmentFunds } = await supabase
    .from("endowment_funds")
    .select("id, name, description, stripe_connect_account_id, created_at")
    .order("name");

  const { count: orgCount } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true });

  const { data: donationStats } = await supabase
    .from("donations")
    .select("amount_cents, status")
    .eq("status", "succeeded");

  type DonationStat = { amount_cents: number | null; status: string };
  const totalDonationsCents =
    (donationStats as DonationStat[] | null)?.reduce(
      (sum, d) => sum + Number(d.amount_cents ?? 0),
      0
    ) ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Platform Admin</h1>
        <p className="text-muted-foreground mt-1">
          Manage endowment funds, organizations, and platform settings.
        </p>
      </div>

      {/* Platform analytics */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Platform analytics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-sm font-medium text-slate-500">Organizations</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{orgCount ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-sm font-medium text-slate-500">Total donations</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              ${((totalDonationsCents ?? 0) / 100).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-sm font-medium text-slate-500">Endowment funds</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {endowmentFunds?.length ?? 0}
            </p>
          </div>
        </div>
      </section>

      {/* Endowment fund management */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Endowment funds</h2>
        <p className="mt-1 text-sm text-slate-600">
          Endowment funds receive 30% of the platform fee from each donation. Create funds and attach Stripe Connect accounts so they can receive transfers.
        </p>
        <EndowmentFundsAdmin initialFunds={endowmentFunds ?? []} />
      </section>
    </div>
  );
}
