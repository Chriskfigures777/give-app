import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { GoalsClient } from "./goals-client";

export default async function GoalsPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) redirect("/dashboard");

  const { data: campaigns } = await supabase
    .from("donation_campaigns")
    .select("id, name, description, goal_amount_cents, current_amount_cents, goal_deadline, is_active, suggested_amounts, minimum_amount_cents, allow_recurring, allow_anonymous")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto overflow-x-hidden">
      <div className="grid grid-cols-1 gap-6 px-4 py-6">
        <header className="dashboard-fade-in min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Goals & campaigns</h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Create and manage fundraising goals. Select a campaign when embedding forms to track progress toward your goal.
          </p>
        </header>

        <GoalsClient campaigns={campaigns ?? []} />
      </div>
    </div>
  );
}
