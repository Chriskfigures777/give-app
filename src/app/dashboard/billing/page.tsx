import { requireAuth } from "@/lib/auth";
import { getOrgPlan, isPlanStatusActive, normalizePlan, type OrgPlan } from "@/lib/plan";
import { BillingPageClient } from "./billing-page-client";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; plan?: string; canceled?: string }>;
}) {
  const { profile, supabase } = await requireAuth();
  const params = await searchParams;

  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  let plan: OrgPlan = "free";
  let planStatus = null;
  let stripeCustomerId: string | null = null;
  let subscriptionId: string | null = null;

  if (orgId) {
    const result = await getOrgPlan(orgId, supabase);
    plan = result.plan;
    planStatus = result.planStatus;
    stripeCustomerId = result.stripeCustomerId;
    subscriptionId = result.subscriptionId;
  }

  const isActive = isPlanStatusActive(planStatus);
  const successPlan = params.success === "1" && params.plan ? normalizePlan(params.plan) : undefined;
  const canceled = params.canceled === "1";

  return (
    <BillingPageClient
      currentPlan={plan}
      planStatus={planStatus}
      isActive={isActive}
      hasSubscription={!!subscriptionId}
      hasOrg={!!orgId}
      successPlan={successPlan}
      canceled={canceled}
    />
  );
}
