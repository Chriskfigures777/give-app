/**
 * Platform plan utilities.
 * Plans: free ($0), growth ($29/mo), pro ($49/mo).
 * Add-on: team member ($10/mo per seat).
 *
 * NOTE: "website" is accepted as a legacy alias for "growth" to support
 * existing database rows created before the rename. New subscriptions
 * should always use "growth".
 */

export type OrgPlan = "free" | "growth" | "pro";

/** Legacy alias — existing DB rows may still contain "website". */
export type OrgPlanLegacy = OrgPlan | "website";

export type PlanStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | null;

/** Normalize legacy "website" → "growth". */
export function normalizePlan(raw: string | null | undefined): OrgPlan {
  if (raw === "website" || raw === "growth") return "growth";
  if (raw === "pro") return "pro";
  return "free";
}

export const PLAN_META: Record<
  OrgPlan,
  {
    name: string;
    priceCents: number;
    trialDays: number;
    formLimit: number;
    splitRecipientLimit: number;
    missionaryLimit: number;
  }
> = {
  free: {
    name: "Free Forever",
    priceCents: 0,
    trialDays: 0,
    formLimit: Infinity,
    splitRecipientLimit: 2,
    missionaryLimit: 0,
  },
  growth: {
    name: "Growth",
    priceCents: 2900,
    trialDays: 14,
    formLimit: Infinity,
    splitRecipientLimit: 7,
    missionaryLimit: 3,
  },
  pro: {
    name: "Pro",
    priceCents: 4900,
    trialDays: 14,
    formLimit: Infinity,
    splitRecipientLimit: Infinity,
    missionaryLimit: Infinity,
  },
};

/** Team member add-on: $10/mo per seat. */
export const TEAM_MEMBER_ADDON = {
  priceCents: 1000,
  label: "Team member",
} as const;

/** Returns true if the subscription status counts as active access. */
export function isPlanStatusActive(status: PlanStatus): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Returns true if the org has effective access to the given plan tier.
 * A 'growth' or 'pro' org still needs an active/trialing subscription.
 * Free plan is always accessible.
 */
export function hasAccessToPlan(
  orgPlan: OrgPlanLegacy,
  planStatus: PlanStatus,
  requiredPlan: OrgPlan
): boolean {
  const normalized = normalizePlan(orgPlan);
  if (requiredPlan === "free") return true;
  if (requiredPlan === "growth") {
    return (normalized === "growth" || normalized === "pro") && isPlanStatusActive(planStatus);
  }
  if (requiredPlan === "pro") {
    return normalized === "pro" && isPlanStatusActive(planStatus);
  }
  return false;
}

/** Feature gates — which plan is required for each feature. */
export const FEATURE_GATES = {
  websiteBuilder: "growth",
  splits: "free",
  customDomains: "growth",
  cms: "pro",
  advancedAnalytics: "pro",
  unlimitedPages: "pro",
} as const satisfies Record<string, OrgPlan>;

/** Returns the form limit for a given plan, considering subscription status. */
export function getEffectiveFormLimit(plan: OrgPlanLegacy, planStatus: PlanStatus): number {
  const normalized = normalizePlan(plan);
  if (normalized === "free" || !isPlanStatusActive(planStatus)) {
    return PLAN_META.free.formLimit;
  }
  return PLAN_META[normalized].formLimit;
}

/** Returns the split recipient limit for a given plan, considering subscription status. */
export function getEffectiveSplitRecipientLimit(plan: OrgPlanLegacy, planStatus: PlanStatus): number {
  const normalized = normalizePlan(plan);
  if (normalized === "free" || !isPlanStatusActive(planStatus)) {
    return PLAN_META.free.splitRecipientLimit;
  }
  return PLAN_META[normalized].splitRecipientLimit;
}

/** Returns the Stripe price ID for a plan from environment variables. */
export function getStripePriceId(plan: "growth" | "pro"): string {
  const key =
    plan === "growth"
      ? process.env.STRIPE_GROWTH_PLAN_PRICE_ID
      : process.env.STRIPE_PRO_PLAN_PRICE_ID;
  if (!key) {
    throw new Error(
      `Missing env var: ${plan === "growth" ? "STRIPE_GROWTH_PLAN_PRICE_ID" : "STRIPE_PRO_PLAN_PRICE_ID"}. Run /api/admin/setup-stripe-products to create products.`
    );
  }
  return key;
}

/** Returns the Stripe price ID for the team member add-on. */
export function getTeamMemberAddonPriceId(): string {
  const key = process.env.STRIPE_TEAM_MEMBER_ADDON_PRICE_ID;
  if (!key) {
    throw new Error("Missing env var: STRIPE_TEAM_MEMBER_ADDON_PRICE_ID.");
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
    plan: normalizePlan(row.plan),
    planStatus: (row.plan_status as PlanStatus) ?? null,
    stripeCustomerId: row.stripe_billing_customer_id,
    subscriptionId: row.stripe_plan_subscription_id,
  };
}
