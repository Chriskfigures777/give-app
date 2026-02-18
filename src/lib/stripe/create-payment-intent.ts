import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { stripe } from "./client";
import { PLATFORM_FEE_PERCENT, CURRENCY } from "./constants";
import { calculateChargeAmountCents, type FeeCoverage } from "@/lib/fee-calculator";
import { FUND_REQUESTS_ENABLED, SPLITS_ENABLED } from "@/lib/feature-flags";

const PLATFORM_FEE_RATE = PLATFORM_FEE_PERCENT / 100;

export type CreatePaymentIntentParams = {
  amountCents: number;
  organizationId: string;
  campaignId?: string;
  endowmentFundId?: string;
  donorEmail: string;
  donorName?: string;
  userId?: string;
  feeCoverage?: FeeCoverage;
  isAnonymous?: boolean;
  paymentFrequency?: string;
  donationLinkId?: string;
  fundRequestId?: string;
  embedCardId?: string;
  supabase: SupabaseClient<Database>;
};

export async function createPaymentIntentForDonation(params: CreatePaymentIntentParams) {
  const {
    amountCents,
    organizationId,
    campaignId,
    endowmentFundId,
    donorEmail,
    donorName,
    userId,
    feeCoverage = "org_pays",
    isAnonymous,
    paymentFrequency = "one_time",
    donationLinkId,
    fundRequestId,
    embedCardId,
    supabase,
  } = params;

  const email = donorEmail.trim();
  if (!email) throw new Error("Email is required");

  if (fundRequestId && !FUND_REQUESTS_ENABLED) {
    throw new Error("Fund requests are not available yet");
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, name, stripe_connect_account_id")
    .eq("id", organizationId)
    .single();

  const org = orgRow as { id: string; name: string; stripe_connect_account_id: string | null } | null;
  if (!org) throw new Error("Organization not found");

  const totalCents = calculateChargeAmountCents(amountCents, feeCoverage);

  // Resolve splits: donation link > embed card > form customization (only when SPLITS_ENABLED)
  // Stripe Connect only — split to connected org accounts.
  type SplitEntry = { percentage: number; accountId?: string };
  let splits: SplitEntry[] | null = null;

  if (SPLITS_ENABLED && donationLinkId) {
    const { data: link } = await supabase
      .from("donation_links")
      .select("id, splits, split_mode, organization_id")
      .eq("id", donationLinkId)
      .eq("organization_id", organizationId)
      .single();

    const linkRow = link as { id: string; splits?: SplitEntry[]; split_mode?: string } | null;
    if (!linkRow?.splits?.length) throw new Error("Donation link not found or has no splits");
    splits = linkRow.splits.filter((s) => s.accountId);
  } else if (SPLITS_ENABLED && embedCardId) {
    const { data: card } = await supabase
      .from("org_embed_cards")
      .select("id, splits, organization_id")
      .eq("id", embedCardId)
      .eq("organization_id", organizationId)
      .single();

    const cardRow = card as { id: string; splits?: SplitEntry[] | null } | null;
    if (cardRow) {
      const cardSplits = Array.isArray(cardRow.splits) && cardRow.splits.length > 0 ? cardRow.splits : null;
      if (cardSplits) {
        splits = cardSplits.filter((s) => s.accountId);
      } else {
        const { data: formRow } = await supabase
          .from("form_customizations")
          .select("splits")
          .eq("organization_id", organizationId)
          .single();
        const form = formRow as { splits?: SplitEntry[] } | null;
        splits = Array.isArray(form?.splits) && form.splits.length > 0 ? form.splits.filter((s) => s.accountId) : null;
      }
    } else {
      const { data: formRow } = await supabase
        .from("form_customizations")
        .select("splits")
        .eq("organization_id", organizationId)
        .single();
      const form = formRow as { splits?: SplitEntry[] } | null;
      splits = Array.isArray(form?.splits) && form.splits.length > 0 ? form.splits.filter((s) => s.accountId) : null;
    }
  } else if (SPLITS_ENABLED) {
    const { data: formRow } = await supabase
      .from("form_customizations")
      .select("splits")
      .eq("organization_id", organizationId)
      .single();
    const form = formRow as { splits?: SplitEntry[] } | null;
    splits = Array.isArray(form?.splits) && form.splits.length > 0 ? form.splits.filter((s) => s.accountId) : null;
  }

  if (SPLITS_ENABLED && splits && splits.length > 0 && org.stripe_connect_account_id) {
    // Charge on form owner's Connect account. application_fee = platform fee only.
    // Peer shares stay on Connect account; webhook transfers Connect → Connect.
    const stripeSplits = splits.filter((s) => s.accountId);
    const platformFeeCents = Math.round(totalCents * PLATFORM_FEE_RATE);
    const applicationFeeCents = platformFeeCents;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: totalCents,
        currency: CURRENCY,
        application_fee_amount: applicationFeeCents,
        receipt_email: email || undefined,
        metadata: {
          organization_id: organizationId,
          campaign_id: campaignId ?? "",
          donor_email: email,
          donor_name: isAnonymous ? "Anonymous" : (donorName?.trim() ?? ""),
          user_id: userId ?? "",
          donation_amount_cents: String(amountCents),
          splits: JSON.stringify(stripeSplits),
          split_mode: "stripe_connect",
          donation_link_id: donationLinkId ?? "",
          embed_card_id: embedCardId ?? "",
          fund_request_id: fundRequestId ?? "",
          application_fee_cents: String(applicationFeeCents),
        },
        automatic_payment_methods: { enabled: true },
      },
      { stripeAccount: org.stripe_connect_account_id }
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      stripeConnectAccountId: org.stripe_connect_account_id,
    };
  }

  if (!org.stripe_connect_account_id) throw new Error("Organization not set up for payments");

  const applicationFeeCents = Math.round(amountCents * PLATFORM_FEE_RATE);
  // Direct charge: create on connected account; platform receives application_fee_amount (1%)
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: totalCents,
      currency: CURRENCY,
      application_fee_amount: applicationFeeCents,
      receipt_email: email || undefined,
      metadata: {
        organization_id: organizationId,
        campaign_id: campaignId ?? "",
        endowment_fund_id: endowmentFundId ?? "",
        donor_email: email,
        donor_name: isAnonymous ? "Anonymous" : (donorName?.trim() ?? ""),
        user_id: userId ?? "",
        application_fee_cents: String(applicationFeeCents),
        payment_frequency: paymentFrequency,
        donation_amount_cents: String(amountCents),
        fee_coverage: feeCoverage,
        fund_request_id: fundRequestId ?? "",
      },
      automatic_payment_methods: { enabled: true },
    },
    { stripeAccount: org.stripe_connect_account_id }
  );

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    stripeConnectAccountId: org.stripe_connect_account_id,
  };
}
