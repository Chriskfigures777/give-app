import { createClient } from "@/lib/supabase/server";
import { FUND_REQUESTS_ENABLED, SPLITS_ENABLED } from "@/lib/feature-flags";
import { EndowmentFundsAdmin } from "./endowment-funds-admin";

export default async function DashboardAdminPage() {
  const supabase = await createClient();

  const [
    { data: endowmentFunds },
    { count: orgCount },
    { count: userCount },
    { data: donationStats },
  ] = await Promise.all([
    supabase
      .from("endowment_funds")
      .select("id, name, description, stripe_connect_account_id, created_at")
      .order("name"),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("user_profiles").select("id", { count: "exact", head: true }),
    supabase.from("donations").select("amount_cents, status").eq("status", "succeeded"),
  ]);

  type DonationStat = { amount_cents: number | null; status: string };
  const totalDonationsCents =
    (donationStats as DonationStat[] | null)?.reduce(
      (sum, d) => sum + Number(d.amount_cents ?? 0),
      0
    ) ?? 0;

  return (
    <div className="space-y-8">
      {/* Platform analytics */}
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-dashboard-text">Platform analytics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 p-4">
            <p className="text-sm font-medium text-dashboard-text-muted">Organizations</p>
            <p className="mt-1 text-2xl font-bold text-dashboard-text">{orgCount ?? 0}</p>
          </div>
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 p-4">
            <p className="text-sm font-medium text-dashboard-text-muted">Total users</p>
            <p className="mt-1 text-2xl font-bold text-dashboard-text">{userCount ?? 0}</p>
          </div>
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 p-4">
            <p className="text-sm font-medium text-dashboard-text-muted">Total donations</p>
            <p className="mt-1 text-2xl font-bold text-dashboard-text">
              ${((totalDonationsCents ?? 0) / 100).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 p-4">
            <p className="text-sm font-medium text-dashboard-text-muted">Endowment funds</p>
            <p className="mt-1 text-2xl font-bold text-dashboard-text">
              {endowmentFunds?.length ?? 0}
            </p>
          </div>
        </div>
      </section>

      {/* Automation & features */}
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-dashboard-text">Automation & features</h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          Platform-wide flags for bill automation, splits to bank accounts, and fund requests.
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-dashboard-border bg-dashboard-card-hover/50 px-4 py-3">
            <div>
              <p className="font-medium text-dashboard-text">Payment splits (Stripe Connect)</p>
              <p className="text-sm text-dashboard-text-muted">Donation links, embed cards, form customization</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                SPLITS_ENABLED ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              {SPLITS_ENABLED ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-dashboard-border bg-dashboard-card-hover/50 px-4 py-3">
            <div>
              <p className="font-medium text-dashboard-text">Fund requests (chat)</p>
              <p className="text-sm text-dashboard-text-muted">Orgs request funds; donors fulfill in-thread</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                FUND_REQUESTS_ENABLED ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              {FUND_REQUESTS_ENABLED ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-dashboard-border bg-dashboard-card-hover/50 px-4 py-3">
            <div>
              <p className="font-medium text-dashboard-text">Bill automation</p>
              <p className="text-sm text-dashboard-text-muted">Auto-pay bills from bills fund — design complete, implementation coming soon</p>
            </div>
            <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-400">
              Coming soon
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs text-dashboard-text-muted">
          To change these, edit <code className="rounded bg-dashboard-card-hover px-1">src/lib/feature-flags.ts</code> and redeploy.
        </p>
      </section>

      {/* Endowment fund management */}
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-dashboard-text">Endowment funds</h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          Endowment funds receive 30% of the platform fee from each donation. Create funds and attach Stripe Connect accounts so they can receive transfers.
        </p>
        <EndowmentFundsAdmin initialFunds={endowmentFunds ?? []} />
      </section>
    </div>
  );
}
