import { requirePlatformAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FUND_REQUESTS_ENABLED, SPLITS_ENABLED } from "@/lib/feature-flags";
import { EndowmentFundsAdmin } from "./endowment-funds-admin";
import { AdminLayout } from "./admin-layout";
import { SurveyResponsesTab } from "./survey-responses-tab";
import type { SurveyResponse } from "../survey-results/page";

export default async function DashboardAdminPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const [
    { data: endowmentFunds },
    { count: orgCount },
    { data: donationStats },
    { data: surveyResponses },
  ] = await Promise.all([
    supabase
      .from("endowment_funds")
      .select("id, name, description, stripe_connect_account_id, created_at")
      .order("name"),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("donations").select("amount_cents, status").eq("status", "succeeded"),
    supabase
      .from("church_market_survey_responses")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  type DonationStat = { amount_cents: number | null; status: string };
  const totalDonationsCents =
    (donationStats as DonationStat[] | null)?.reduce(
      (sum, d) => sum + Number(d.amount_cents ?? 0),
      0
    ) ?? 0;

  const overviewPanel = (
    <div className="space-y-10">
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

      {/* Automation & features */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Automation & features</h2>
        <p className="mt-1 text-sm text-slate-600">
          Platform-wide flags for bill automation, splits to bank accounts, and fund requests.
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">Payment splits (Stripe Connect)</p>
              <p className="text-sm text-slate-500">Donation links, embed cards, form customization</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                SPLITS_ENABLED ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
              }`}
            >
              {SPLITS_ENABLED ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">Fund requests (chat)</p>
              <p className="text-sm text-slate-500">Orgs request funds; donors fulfill in-thread</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                FUND_REQUESTS_ENABLED ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
              }`}
            >
              {FUND_REQUESTS_ENABLED ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">Bill automation</p>
              <p className="text-sm text-slate-500">Auto-pay bills from bills fund — design complete, implementation coming soon</p>
            </div>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-600">
              Coming soon
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          To change these, edit <code className="rounded bg-slate-100 px-1">src/lib/feature-flags.ts</code> and redeploy.
        </p>
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

  const surveyPanel = (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/30">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        What people are saying
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Full survey responses with each question and answer.
      </p>
      <div className="mt-6">
        <SurveyResponsesTab responses={(surveyResponses as SurveyResponse[]) ?? []} />
      </div>
    </section>
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Platform Admin</h1>
        <p className="text-muted-foreground mt-1">
          Manage endowment funds, organizations, and platform settings.
        </p>
      </div>
      <AdminLayout overviewPanel={overviewPanel} surveyPanel={surveyPanel} />
    </div>
  );
}
