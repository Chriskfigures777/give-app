import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { OrgsTable } from "./orgs-table";

export default async function AdminOrganizationsPage() {
  const supabase = await createClient();

  // @ts-ignore – plan/plan_status columns not in generated types
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, slug, org_type, city, state, owner_user_id, member_count, website_url, stripe_connect_account_id, created_at, plan, plan_status, stripe_billing_customer_id")
    .order("created_at", { ascending: false });

  const total = orgs?.length ?? 0;
  const withPlan = orgs?.filter((o: { plan?: string }) => o.plan && o.plan !== "free").length ?? 0;
  const withConnect = orgs?.filter((o: { stripe_connect_account_id?: string }) => o.stripe_connect_account_id).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4">
          <p className="text-sm text-dashboard-text-muted">Total orgs</p>
          <p className="mt-1 text-2xl font-bold text-dashboard-text tabular-nums">{total}</p>
        </div>
        <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4">
          <p className="text-sm text-dashboard-text-muted">On paid plan</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{withPlan}</p>
        </div>
        <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4">
          <p className="text-sm text-dashboard-text-muted">Stripe Connect</p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{withConnect}</p>
        </div>
      </div>

      {/* Table */}
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
        <OrgsTable orgs={(orgs as Record<string, unknown>[]) ?? []} />
      </section>
    </div>
  );
}
