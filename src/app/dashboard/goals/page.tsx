import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { OrgGoalsClient } from "./org-goals-client";

export default async function GoalsPage() {
  const { profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) redirect("/dashboard");

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto overflow-x-hidden">
      <div className="grid grid-cols-1 gap-6 px-4 py-6">
        <header className="dashboard-fade-in min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Goals</h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Set 90-day, one-year, and three-year goals. Track targets and progress so your team stays aligned.
          </p>
        </header>

        <OrgGoalsClient />
      </div>
    </div>
  );
}
