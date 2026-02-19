import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { requirePlatformAdmin } from "@/lib/auth";

/**
 * POST /api/admin/setup-stripe-products
 * Creates the Website ($35/mo) and Pro ($49/mo) platform plan products in Stripe.
 * Returns the price IDs — add them to .env.local as:
 *   STRIPE_WEBSITE_PLAN_PRICE_ID=price_xxx
 *   STRIPE_PRO_PLAN_PRICE_ID=price_xxx
 *
 * Only callable by platform admins.
 */
export async function POST() {
  await requirePlatformAdmin();

  const results: Record<string, string> = {};

  // Website Plan — $35/month with 14-day trial
  const websiteProduct = await stripe.products.create({
    name: "GIVE Website Plan",
    description: "Website builder, split transactions, custom domains. 14-day free trial.",
    metadata: { plan: "website" },
  });

  const websitePrice = await stripe.prices.create({
    product: websiteProduct.id,
    unit_amount: 3500, // $35.00
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 14,
    },
    metadata: { plan: "website" },
  });

  results["STRIPE_WEBSITE_PLAN_PRICE_ID"] = websitePrice.id;
  results["website_product_id"] = websiteProduct.id;

  // Pro Plan — $49/month with 14-day trial
  const proProduct = await stripe.products.create({
    name: "GIVE Pro Plan",
    description: "Full website builder, CMS, unlimited pages, advanced analytics. 14-day free trial.",
    metadata: { plan: "pro" },
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 4900, // $49.00
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 14,
    },
    metadata: { plan: "pro" },
  });

  results["STRIPE_PRO_PLAN_PRICE_ID"] = proPrice.id;
  results["pro_product_id"] = proProduct.id;

  return NextResponse.json({
    message: "Products created. Add these to your .env.local:",
    env_vars: {
      STRIPE_WEBSITE_PLAN_PRICE_ID: websitePrice.id,
      STRIPE_PRO_PLAN_PRICE_ID: proPrice.id,
    },
    details: results,
  });
}

/**
 * GET /api/admin/setup-stripe-products
 * Lists existing platform plan products/prices in Stripe.
 */
export async function GET() {
  await requirePlatformAdmin();

  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
    limit: 100,
  });

  const planPrices = prices.data.filter((p) => {
    const prod = p.product as { metadata?: Record<string, string> };
    return prod?.metadata?.plan === "website" || prod?.metadata?.plan === "pro";
  });

  return NextResponse.json({
    prices: planPrices.map((p) => ({
      id: p.id,
      plan: (p.product as { metadata?: Record<string, string> })?.metadata?.plan,
      unit_amount: p.unit_amount,
      currency: p.currency,
      interval: p.recurring?.interval,
      trial_period_days: p.recurring?.trial_period_days,
    })),
    current_env: {
      STRIPE_WEBSITE_PLAN_PRICE_ID: process.env.STRIPE_WEBSITE_PLAN_PRICE_ID ?? "(not set)",
      STRIPE_PRO_PLAN_PRICE_ID: process.env.STRIPE_PRO_PLAN_PRICE_ID ?? "(not set)",
    },
  });
}
