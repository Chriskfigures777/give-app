import { stripe } from "@/lib/stripe/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type VerificationStatus = "none" | "actions_required" | "pending" | "verified";

/**
 * Retrieve the Stripe Connect verification status for an organization.
 * Returns "verified" when charges_enabled or payouts_enabled is true.
 */
export async function getVerificationStatus(
  stripeConnectAccountId: string | null
): Promise<VerificationStatus> {
  if (!stripeConnectAccountId) return "none";
  try {
    const account = await stripe.accounts.retrieve(stripeConnectAccountId);
    const verified =
      account.charges_enabled === true || account.payouts_enabled === true;
    const hasRequirements =
      (account.requirements?.currently_due?.length ?? 0) > 0 ||
      (account.requirements?.eventually_due?.length ?? 0) > 0;
    if (verified) return "verified";
    if (hasRequirements) return "actions_required";
    if (account.details_submitted === true) return "pending";
    return "none";
  } catch {
    return "none";
  }
}

/**
 * Fetch an organization's Stripe Connect account ID and onboarding status.
 */
export async function getOrgVerification(
  orgId: string,
  supabase: SupabaseClient
): Promise<{
  stripeConnectAccountId: string | null;
  onboardingCompleted: boolean;
  verificationStatus: VerificationStatus;
}> {
  const { data } = await supabase
    .from("organizations")
    .select("stripe_connect_account_id, onboarding_completed")
    .eq("id", orgId)
    .single();

  const row = data as {
    stripe_connect_account_id: string | null;
    onboarding_completed: boolean | null;
  } | null;

  const stripeConnectAccountId = row?.stripe_connect_account_id ?? null;
  const onboardingCompleted = row?.onboarding_completed === true;

  if (onboardingCompleted) {
    return { stripeConnectAccountId, onboardingCompleted, verificationStatus: "verified" };
  }

  const verificationStatus = await getVerificationStatus(stripeConnectAccountId);
  return { stripeConnectAccountId, onboardingCompleted, verificationStatus };
}
