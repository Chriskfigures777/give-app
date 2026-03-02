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

/**
 * Create a Stripe Checkout Session for a recurring donation (monthly/yearly).
 * Requires user to be logged in.
 * POST body: { amountCents, organizationId, campaignId?, endowmentFundId?, donorEmail?, donorName?, feeCoverage?, interval: 'month'|'year', slug? }
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
      isAnonymous,
      feeCoverage = "org_pays",
      interval = "month",
      slug,
      frequency,
    } = body as {
      amountCents: number;
      organizationId: string;
      campaignId?: string;
      endowmentFundId?: string;
      donorEmail?: string;
      donorName?: string;
      isAnonymous?: boolean;
      feeCoverage?: FeeCoverage;
      interval?: "month" | "year";
      slug?: string;
      frequency?: "monthly" | "yearly";
    };

    if (!amountCents || amountCents < 100 || !organizationId) {
      return NextResponse.json(
        { error: "Invalid amount or organization" },
        { status: 400 }
      );
    }

    if (interval !== "month" && interval !== "year") {
      return NextResponse.json(
        { error: "Interval must be month or year" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json(
        { error: "Sign in required for recurring donations" },
        { status: 401 }
      );
    }

    const email = donorEmail?.trim() || user.email;
    if (!email) {
      return NextResponse.json(
        { error: "Email is required for tax receipts and donation records." },
        { status: 400 }
      );
    }

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

    const totalCents = calculateChargeAmountCents(amountCents, feeCoverage);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const successUrl = `${baseUrl}/give/complete${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`;
    const cancelUrl = `${baseUrl}/give/${slug || organizationId}${frequency ? `?frequency=${encodeURIComponent(frequency)}` : ""}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: `Recurring gift to ${org.name}`,
              description: `$${(amountCents / 100).toFixed(2)} ${interval === "month" ? "monthly" : "yearly"} donation`,
            },
            unit_amount: totalCents,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        application_fee_percent: PLATFORM_FEE_PERCENT,
        transfer_data: {
          destination: org.stripe_connect_account_id,
        },
        metadata: {
          organization_id: organizationId,
          campaign_id: campaignId ?? "",
          endowment_fund_id: endowmentFundId ?? "",
          donor_email: email,
          donor_name: isAnonymous ? "Anonymous" : (donorName?.trim() ?? ""),
          user_id: user.id,
          donation_amount_cents: String(amountCents),
          fee_coverage: feeCoverage,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organization_id: organizationId,
        campaign_id: campaignId ?? "",
        user_id: user.id,
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (e) {
    console.error("create-subscription-checkout error", e);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
