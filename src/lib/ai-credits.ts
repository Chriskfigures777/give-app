/**
 * AI credits/usage for org (e.g. generate_survey_questions). Cap by plan: free=5, website=20, pro=50 per month.
 */
import { createServiceClient } from "@/lib/supabase/server";

const FEATURE = "generate_survey_questions";

const CAP_BY_PLAN: Record<string, number> = {
  free: 5,
  website: 20,
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

export async function getCap(organizationId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", organizationId)
    .single();
  const plan = (data as { plan?: string } | null)?.plan ?? "free";
  return CAP_BY_PLAN[plan] ?? DEFAULT_CAP;
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

export async function getRemainingCredits(organizationId: string): Promise<{ used: number; cap: number; remaining: number }> {
  const [used, cap] = await Promise.all([
    getUsageThisMonth(organizationId),
    getCap(organizationId),
  ]);
  return { used, cap, remaining: Math.max(0, cap - used) };
}
