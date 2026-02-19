/**
 * Platform plan utilities.
 * Plans: free ($0), website ($35/mo), pro ($49/mo).
 */

export type OrgPlan = "free" | "website" | "pro";

export type PlanStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | null;

export const PLAN_META: Record<OrgPlan, { name: string; priceCents: number; trialDays: number; formLimit: number; splitRecipientLimit: number }> = {
  free: { name: "Free", priceCents: 0, trialDays: 0, formLimit: 3, splitRecipientLimit: 1 },
  website: { name: "Website", priceCents: 3500, trialDays: 14, formLimit: 10, splitRecipientLimit: 5 },
  pro: { name: "Pro", priceCents: 4900, trialDays: 14, formLimit: Infinity, splitRecipientLimit: Infinity },
};

/** Returns true if the subscription status counts as active access. */
export function isPlanStatusActive(status: PlanStatus): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Returns true if the org has effective access to the given plan tier.
 * A 'website' or 'pro' org still needs an active/trialing subscription.
 * Free plan is always accessible.
 */
export function hasAccessToPlan(
  orgPlan: OrgPlan,
  planStatus: PlanStatus,
  requiredPlan: OrgPlan
): boolean {
  if (requiredPlan === "free") return true;
  if (requiredPlan === "website") {
    return (orgPlan === "website" || orgPlan === "pro") && isPlanStatusActive(planStatus);
  }
  if (requiredPlan === "pro") {
    return orgPlan === "pro" && isPlanStatusActive(planStatus);
  }
  return false;
}

/** Feature gates — which plan is required for each feature. */
export const FEATURE_GATES = {
  websiteBuilder: "website",
  splits: "free",
  customDomains: "website",
  cms: "pro",
  advancedAnalytics: "pro",
  unlimitedPages: "pro",
} as const satisfies Record<string, OrgPlan>;

/** Returns the form limit for a given plan, considering subscription status. */
export function getEffectiveFormLimit(plan: OrgPlan, planStatus: PlanStatus): number {
  if (plan === "free" || !isPlanStatusActive(planStatus)) {
    return PLAN_META.free.formLimit;
  }
  return PLAN_META[plan].formLimit;
}

/** Returns the split recipient limit for a given plan, considering subscription status. */
export function getEffectiveSplitRecipientLimit(plan: OrgPlan, planStatus: PlanStatus): number {
  if (plan === "free" || !isPlanStatusActive(planStatus)) {
    return PLAN_META.free.splitRecipientLimit;
  }
  return PLAN_META[plan].splitRecipientLimit;
}

/** Returns the Stripe price ID for a plan from environment variables. */
export function getStripePriceId(plan: "website" | "pro"): string {
  const key =
    plan === "website"
      ? process.env.STRIPE_WEBSITE_PLAN_PRICE_ID
      : process.env.STRIPE_PRO_PLAN_PRICE_ID;
  if (!key) {
    throw new Error(
      `Missing env var: ${plan === "website" ? "STRIPE_WEBSITE_PLAN_PRICE_ID" : "STRIPE_PRO_PLAN_PRICE_ID"}. Run /api/admin/setup-stripe-products to create products.`
    );
  }
  return key;
}

/** Fetch the org's current plan from Supabase. Returns 'free' if not found. */
export async function getOrgPlan(
  orgId: string,
  supabase: import("@supabase/supabase-js").SupabaseClient
): Promise<{ plan: OrgPlan; planStatus: PlanStatus; stripeCustomerId: string | null; subscriptionId: string | null }> {
  const { data } = await supabase
    .from("organizations")
    .select("plan, plan_status, stripe_billing_customer_id, stripe_plan_subscription_id")
    .eq("id", orgId)
    .single();

  if (!data) {
    return { plan: "free", planStatus: null, stripeCustomerId: null, subscriptionId: null };
  }

  const row = data as {
    plan: string | null;
    plan_status: string | null;
    stripe_billing_customer_id: string | null;
    stripe_plan_subscription_id: string | null;
  };

  return {
    plan: (row.plan as OrgPlan) ?? "free",
    planStatus: (row.plan_status as PlanStatus) ?? null,
    stripeCustomerId: row.stripe_billing_customer_id,
    subscriptionId: row.stripe_plan_subscription_id,
  };
}
