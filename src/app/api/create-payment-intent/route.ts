import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import {
  PLATFORM_FEE_PERCENT,
  CURRENCY,
} from "@/lib/stripe/constants";
import {
  calculateChargeAmountCents,
  type FeeCoverage,
} from "@/lib/fee-calculator";

const PLATFORM_FEE_RATE = PLATFORM_FEE_PERCENT / 100;

/**
 * Create a PaymentIntent for a one-time donation.
 * One charge only - Stripe does not charge twice.
 * Amount = donation + (fee if donor covers). Application fee = 1% of donation.
 * Request body: { amountCents, organizationId, campaignId?, endowmentFundId?, donorEmail?, donorName?, userId?, feeCoverage? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
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
    } = body as {
      amountCents: number;
      organizationId: string;
      campaignId?: string;
      endowmentFundId?: string;
      donorEmail?: string;
      donorName?: string;
      userId?: string;
      feeCoverage?: FeeCoverage;
      isAnonymous?: boolean;
      paymentFrequency?: "one_time" | "monthly" | "yearly";
    };

    if (!amountCents || amountCents < 100 || !organizationId) {
      return NextResponse.json(
        { error: "Invalid amount or organization" },
        { status: 400 }
      );
    }
    const email = donorEmail?.trim();
    if (!email) {
      return NextResponse.json(
        { error: "Email is required for tax receipts and donation records." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, stripe_connect_account_id")
      .eq("id", organizationId)
      .single();

    const org = orgRow as { id: string; name: string; stripe_connect_account_id: string | null } | null;
    if (!org?.stripe_connect_account_id) {
      return NextResponse.json(
        { error: "Organization not set up for payments" },
        { status: 400 }
      );
    }

    const applicationFeeCents = Math.round(amountCents * PLATFORM_FEE_RATE);
    const totalCents = calculateChargeAmountCents(amountCents, feeCoverage);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: CURRENCY,
      application_fee_amount: applicationFeeCents,
      receipt_email: email || undefined,
      transfer_data: {
        destination: org.stripe_connect_account_id,
      },
      metadata: {
        organization_id: organizationId,
        campaign_id: campaignId ?? "",
        endowment_fund_id: endowmentFundId ?? "",
        donor_email: email,
        donor_name: isAnonymous ? "Anonymous" : (donorName?.trim() ?? ""),
        user_id: userId ?? authUser?.id ?? "",
        application_fee_cents: String(applicationFeeCents),
        payment_frequency: paymentFrequency ?? "one_time",
        donation_amount_cents: String(amountCents),
        fee_coverage: feeCoverage,
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (e) {
    console.error("create-payment-intent error", e);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
