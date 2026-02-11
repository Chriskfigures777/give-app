import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { stripe } from "./client";

/**
 * Create a Stripe Connect Custom account so onboarding stays fully in-app (no Stripe popup/redirect).
 * Custom accounts use controller.requirement_collection=application, enabling disable_stripe_user_authentication.
 */
export async function createConnectAccount(params: {
  email: string;
  organizationId: string;
  organizationName: string;
}): Promise<{ accountId: string }> {
  const account = await stripe.accounts.create({
    type: "custom",
    country: "US",
    email: params.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      organization_id: params.organizationId,
    },
    business_profile: {
      name: params.organizationName,
      mcc: "8398", // Religious organizations
    },
  });
  return { accountId: account.id };
}

/**
 * Create an account link only when KYC is required (e.g. after first payout threshold).
 * Platform branding: use your own page that redirects to this link.
 */
export async function createOnboardingLink(
  stripeAccountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<{ url: string }> {
  const link = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return { url: link.url };
}

/**
 * Persist Connect account and optionally link to connect_accounts table.
 * Organizations store stripe_connect_account_id on organizations row.
 */
export async function attachConnectAccountToOrganization(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  stripeAccountId: string
): Promise<void> {
  const { error } = await supabase
    .from("organizations")
    // @ts-expect-error - Supabase client infers update payload as never in some setups
    .update({ stripe_connect_account_id: stripeAccountId, updated_at: new Date().toISOString() })
    .eq("id", organizationId);
  if (error) throw new Error("Failed to attach Connect account");
}

/**
 * Create a Stripe Connect Custom account for an endowment fund.
 * Endowment funds receive 30% of the platform fee via transfers.
 */
export async function createConnectAccountForEndowment(params: {
  endowmentFundId: string;
  endowmentName: string;
}): Promise<{ accountId: string }> {
  const account = await stripe.accounts.create({
    type: "custom",
    country: "US",
    email: "platform@give.example.com", // Platform-managed; update with your domain
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      endowment_fund_id: params.endowmentFundId,
    },
    business_profile: {
      name: params.endowmentName,
      mcc: "8398", // Religious / charitable organizations
    },
  });
  return { accountId: account.id };
}

/**
 * Create an Account Session for embedded onboarding (Connect.js account-onboarding component).
 * With Custom accounts, disable_stripe_user_authentication keeps the flow fully in-app (no Stripe popup/redirect).
 */
export async function createAccountSessionForOnboarding(stripeAccountId: string): Promise<{ clientSecret: string }> {
  const session = await stripe.accountSessions.create({
    account: stripeAccountId,
    components: {
      account_onboarding: {
        enabled: true,
        features: {
          disable_stripe_user_authentication: true,
        },
      },
    },
  });
  if (!session.client_secret) throw new Error("Account session missing client_secret");
  return { clientSecret: session.client_secret };
}
