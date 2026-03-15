import { requireAuth } from "@/lib/auth";
import { getOrgPlan, isPlanStatusActive, normalizePlan, type OrgPlan } from "@/lib/plan";
import { getRemainingCredits } from "@/lib/ai-credits";
import { BillingPageClient } from "./billing-page-client";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; plan?: string; canceled?: string; credits_success?: string; credits?: string; credits_canceled?: string }>;
}) {
  const { profile, supabase } = await requireAuth();
  const params = await searchParams;

  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  let plan: OrgPlan = "free";
  let planStatus = null;
  let stripeCustomerId: string | null = null;
  let subscriptionId: string | null = null;

  let trialDaysRemaining: number | null = null;
  let creditsInfo = { used: 0, cap: 0, planCap: 0, purchased: 0, remaining: 0 };

  if (orgId) {
    const result = await getOrgPlan(orgId, supabase);
    plan = result.plan;
    planStatus = result.planStatus;
    stripeCustomerId = result.stripeCustomerId;
    subscriptionId = result.subscriptionId;
    trialDaysRemaining = result.trialDaysRemaining;
    creditsInfo = await getRemainingCredits(orgId);
  }

  const isActive = isPlanStatusActive(planStatus);
  const successPlan = params.success === "1" && params.plan ? normalizePlan(params.plan) : undefined;
  const canceled = params.canceled === "1";
  const creditsSuccess = params.credits_success === "1" ? parseInt(params.credits ?? "0", 10) : undefined;
  const creditsCanceled = params.credits_canceled === "1";

  return (
    <BillingPageClient
      currentPlan={plan}
      planStatus={planStatus}
      isActive={isActive}
      hasSubscription={!!subscriptionId}
      hasOrg={!!orgId}
      successPlan={successPlan}
      canceled={canceled}
      trialDaysRemaining={trialDaysRemaining}
      creditsInfo={creditsInfo}
      creditsSuccess={creditsSuccess}
      creditsCanceled={creditsCanceled}
    />
  );
}
