/**
 * AI credits/usage for org (e.g. generate_survey_questions).
 * Cap by plan: free=5, website=20, pro=50 per month.
 * Orgs can also buy additional credits via Stripe — these are tracked in
 * organizations.ai_credits_purchased and added on top of the monthly cap.
 */
import { createServiceClient } from "@/lib/supabase/server";

const FEATURE = "generate_survey_questions";

const CAP_BY_PLAN: Record<string, number> = {
  free: 5,
  website: 20,
  growth: 20,
  pro: 50,
};

const DEFAULT_CAP = 10;

export async function getUsageThisMonth(organizationId: string): Promise<number> {
  const supabase = createServiceClient();
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();
  const { count, error } = await supabase
    .from("ai_usage_log")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("feature", FEATURE)
    .gte("created_at", startIso);
  if (error) return 0;
  return count ?? 0;
}

export async function getCap(organizationId: string): Promise<{ planCap: number; purchased: number }> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("organizations")
    .select("plan, ai_credits_purchased")
    .eq("id", organizationId)
    .single();
  const plan = (data as { plan?: string; ai_credits_purchased?: number } | null)?.plan ?? "free";
  const purchased = (data as { plan?: string; ai_credits_purchased?: number } | null)?.ai_credits_purchased ?? 0;
  const planCap = CAP_BY_PLAN[plan] ?? DEFAULT_CAP;
  return { planCap, purchased };
}

export async function recordUsage(
  organizationId: string,
  userId: string | null,
  units: number = 1
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("ai_usage_log").insert({
    organization_id: organizationId,
    user_id: userId,
    feature: FEATURE,
    units,
  });
}

export async function getRemainingCredits(organizationId: string): Promise<{
  used: number;
  cap: number;
  planCap: number;
  purchased: number;
  remaining: number;
}> {
  const [used, { planCap, purchased }] = await Promise.all([
    getUsageThisMonth(organizationId),
    getCap(organizationId),
  ]);
  const cap = planCap + purchased;
  return { used, cap, planCap, purchased, remaining: Math.max(0, cap - used) };
}

/** Deduct from purchased credits first (called after usage is recorded). */
export async function deductPurchasedCredit(organizationId: string): Promise<void> {
  const supabase = createServiceClient();
  // Only deduct if org has purchased credits and usage exceeded plan cap this month.
  const { planCap, purchased } = await getCap(organizationId);
  if (purchased <= 0) return;
  const used = await getUsageThisMonth(organizationId);
  // If usage is beyond the plan cap, deduct from purchased credits.
  if (used > planCap) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("decrement_ai_credits_purchased", {
      org_id: organizationId,
    });
  }
}
