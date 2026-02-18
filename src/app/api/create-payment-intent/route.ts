import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPaymentIntentForDonation } from "@/lib/stripe/create-payment-intent";
import type { FeeCoverage } from "@/lib/fee-calculator";

/**
 * Create a PaymentIntent for a one-time donation.
 * Request body: { amountCents, organizationId, campaignId?, endowmentFundId?, donorEmail?, donorName?, userId?, feeCoverage?, donationLinkId?, fundRequestId? }
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
      donationLinkId,
      fundRequestId,
      embedCardId,
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
      donationLinkId?: string;
      fundRequestId?: string;
      embedCardId?: string;
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

    const result = await createPaymentIntentForDonation({
      amountCents,
      organizationId,
      campaignId,
      endowmentFundId,
      donorEmail: email,
      donorName: donorName?.trim(),
      userId: userId ?? authUser?.id ?? "",
      feeCoverage,
      isAnonymous,
      paymentFrequency,
      donationLinkId,
      fundRequestId,
      embedCardId,
      supabase,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("create-payment-intent error", e);
    const msg = e instanceof Error ? e.message : "Failed to create payment";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
