import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/donations/by-payment-intent?pi=pi_xxx
 * Create or fetch donation for receipt. Does NOT wait for webhook.
 * 1. If donation exists (webhook ran) → return it
 * 2. Else fetch payment intent from Stripe; if succeeded → create donation now → return
 * Receipt appears instantly when payment succeeds.
 */
export async function GET(req: NextRequest) {
  const pi = req.nextUrl.searchParams.get("pi");
  const slug = req.nextUrl.searchParams.get("slug");
  if (!pi || !pi.startsWith("pi_")) {
    return NextResponse.json({ error: "Invalid payment intent" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 1. Already have it? (webhook ran first)
  const { data: existing } = await supabase
    .from("donations")
    .select("id, receipt_token, status")
    .eq("stripe_payment_intent_id", pi)
    .maybeSingle();

  if (existing && (existing as { status: string }).status === "succeeded") {
    const d = existing as { id: string; receipt_token: string | null };
    return NextResponse.json({
      found: true,
      donationId: d.id,
      receiptToken: d.receipt_token ?? null,
    });
  }

  // 2. Fetch from Stripe and create donation immediately (don't wait for webhook)
  // Connect payments require stripeAccount to retrieve
  let paymentIntent: { id: string; status: string; amount: number; currency: string; latest_charge: string | { id: string } | null; metadata?: Record<string, string> };
  try {
    let piObj = await stripe.paymentIntents.retrieve(pi, { expand: ["latest_charge"] }).catch(() => null);
    if (!piObj && slug) {
      const { data: org } = await supabase
        .from("organizations")
        .select("stripe_connect_account_id")
        .eq("slug", slug)
        .single();
      const acct = (org as { stripe_connect_account_id: string | null } | null)?.stripe_connect_account_id;
      if (acct) {
        piObj = await stripe.paymentIntents.retrieve(pi, { expand: ["latest_charge"], stripeAccount: acct });
      }
    }
    if (!piObj) return NextResponse.json({ found: false }, { status: 200 });
    paymentIntent = piObj as typeof paymentIntent;
  } catch {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  if (paymentIntent.status !== "succeeded") {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  const metadata = paymentIntent.metadata ?? {};
  const organizationId = metadata.organization_id;
  if (!organizationId) {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  const chargeId =
    typeof paymentIntent.latest_charge === "string"
      ? paymentIntent.latest_charge
      : (paymentIntent.latest_charge as { id: string })?.id ?? null;

  const donationAmountCents =
    parseInt(metadata.donation_amount_cents ?? "0", 10) || paymentIntent.amount;

  const receiptToken = randomUUID();
  const { data: inserted, error } = await supabase
    .from("donations")
    .insert({
      amount_cents: donationAmountCents,
      currency: paymentIntent.currency ?? "usd",
      donor_email: metadata.donor_email || null,
      donor_name: metadata.donor_name || null,
      endowment_fund_id: metadata.endowment_fund_id || null,
      stripe_payment_intent_id: pi,
      stripe_charge_id: chargeId,
      status: "succeeded",
      organization_id: organizationId,
      campaign_id: metadata.campaign_id || null,
      user_id: metadata.user_id || null,
      receipt_token: receiptToken,
      metadata: { payment_intent: pi, created_via: "optimistic" },
    })
    .select("id")
    .single();

  if (error) {
    // Race: webhook created it between our check and insert
    const { data: retry } = await supabase
      .from("donations")
      .select("id, receipt_token")
      .eq("stripe_payment_intent_id", pi)
      .single();
    if (retry) {
      return NextResponse.json({
        found: true,
        donationId: (retry as { id: string }).id,
        receiptToken: (retry as { receipt_token: string | null }).receipt_token ?? null,
      });
    }
    return NextResponse.json({ found: false }, { status: 200 });
  }

  return NextResponse.json({
    found: true,
    donationId: (inserted as { id: string }).id,
    receiptToken,
  });
}
