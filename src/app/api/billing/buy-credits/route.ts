import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { CREDIT_BUNDLES, type CreditBundleId } from "./credit-bundles";

/**
 * POST /api/billing/buy-credits
 * Creates a Stripe Checkout session for a one-time AI credits purchase.
 * The platform collects an application fee on each purchase.
 * Body: { bundle: 'credits_25' | 'credits_100' | 'credits_250' }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const bundleId = body.bundle as CreditBundleId;
    const bundle = CREDIT_BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) {
      return NextResponse.json({ error: "Invalid credit bundle" }, { status: 400 });
    }

    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("organization_id, preferred_organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileRow as {
      organization_id: string | null;
      preferred_organization_id: string | null;
    } | null;

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization found. Create an organization first." },
        { status: 400 }
      );
    }

    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, stripe_billing_customer_id")
      .eq("id", orgId)
      .single();

    const org = orgRow as {
      id: string;
      name: string;
      stripe_billing_customer_id: string | null;
    } | null;

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

    // Ensure the org has a Stripe billing customer for easy future purchases.
    let customerId = org.stripe_billing_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: { org_id: orgId, user_id: user.id },
      });
      customerId = customer.id;
      // @ts-ignore
      await supabase
        .from("organizations")
        .update({ stripe_billing_customer_id: customerId })
        .eq("id", orgId);
    }

    // One-time payment checkout session.
    // The platform_fee_cents is your take — charged as a payment_intent_data.application_fee_amount.
    // NOTE: application_fee_amount requires a connected Stripe account destination.
    // Since this is a direct platform charge (not a Connect transfer), we use
    // payment_intent_data.metadata to record the fee intent and handle profit via
    // Stripe's own fee mechanism. The platform fee is embedded in the price itself.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: bundle.price_cents,
            product_data: {
              name: bundle.label,
              description: bundle.description,
              metadata: {
                type: "ai_credits",
                credits: String(bundle.credits),
              },
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          type: "ai_credits_purchase",
          org_id: orgId,
          user_id: user.id,
          bundle_id: bundle.id,
          credits: String(bundle.credits),
          platform_fee_cents: String(bundle.platform_fee_cents),
        },
      },
      metadata: {
        type: "ai_credits_purchase",
        org_id: orgId,
        user_id: user.id,
        bundle_id: bundle.id,
        credits: String(bundle.credits),
        platform_fee_cents: String(bundle.platform_fee_cents),
      },
      success_url: `${baseUrl}/dashboard/billing?credits_success=1&credits=${bundle.credits}`,
      cancel_url: `${baseUrl}/dashboard/billing?credits_canceled=1`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("billing/buy-credits error", e);
    const msg = e instanceof Error ? e.message : "Failed to create checkout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
