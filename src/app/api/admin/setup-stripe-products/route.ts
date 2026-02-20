import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { requirePlatformAdmin } from "@/lib/auth";

/**
 * POST /api/admin/setup-stripe-products
 * Creates the Growth ($29/mo), Pro ($49/mo), and Team Member Add-on ($10/mo)
 * platform plan products in Stripe.
 * Returns the price IDs — add them to .env.local as:
 *   STRIPE_GROWTH_PLAN_PRICE_ID=price_xxx
 *   STRIPE_PRO_PLAN_PRICE_ID=price_xxx
 *   STRIPE_TEAM_MEMBER_ADDON_PRICE_ID=price_xxx
 *
 * Only callable by platform admins.
 */
export async function POST() {
  await requirePlatformAdmin();

  const results: Record<string, string> = {};

  // Growth Plan — $29/month with 14-day trial
  const growthProduct = await stripe.products.create({
    name: "GIVE Growth Plan",
    description: "Custom domain, website builder + publishing, up to 7 split recipients, add & pay up to 3 missionaries. 14-day free trial.",
    metadata: { plan: "growth" },
  });

  const growthPrice = await stripe.prices.create({
    product: growthProduct.id,
    unit_amount: 2900,
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 14,
    },
    metadata: { plan: "growth" },
  });

  results["STRIPE_GROWTH_PLAN_PRICE_ID"] = growthPrice.id;
  results["growth_product_id"] = growthProduct.id;

  // Pro Plan — $49/month with 14-day trial
  const proProduct = await stripe.products.create({
    name: "GIVE Pro Plan",
    description: "Everything unlimited — splits, forms, recipients, missionaries, CMS (sermons/podcast/worship), advanced analytics, unlimited pages. 14-day free trial.",
    metadata: { plan: "pro" },
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 4900,
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 14,
    },
    metadata: { plan: "pro" },
  });

  results["STRIPE_PRO_PLAN_PRICE_ID"] = proPrice.id;
  results["pro_product_id"] = proProduct.id;

  // Team Member Add-on — $10/month per seat
  const teamProduct = await stripe.products.create({
    name: "GIVE Team Member Add-on",
    description: "Add team members to your workspace to manage your account. $10/month per team member.",
    metadata: { plan: "team_member_addon" },
  });

  const teamPrice = await stripe.prices.create({
    product: teamProduct.id,
    unit_amount: 1000,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { plan: "team_member_addon" },
  });

  results["STRIPE_TEAM_MEMBER_ADDON_PRICE_ID"] = teamPrice.id;
  results["team_member_addon_product_id"] = teamProduct.id;

  return NextResponse.json({
    message: "Products created. Add these to your .env.local:",
    env_vars: {
      STRIPE_GROWTH_PLAN_PRICE_ID: growthPrice.id,
      STRIPE_PRO_PLAN_PRICE_ID: proPrice.id,
      STRIPE_TEAM_MEMBER_ADDON_PRICE_ID: teamPrice.id,
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
    return (
      prod?.metadata?.plan === "growth" ||
      prod?.metadata?.plan === "pro" ||
      prod?.metadata?.plan === "team_member_addon" ||
      prod?.metadata?.plan === "website"
    );
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
      STRIPE_GROWTH_PLAN_PRICE_ID: process.env.STRIPE_GROWTH_PLAN_PRICE_ID ?? "(not set)",
      STRIPE_PRO_PLAN_PRICE_ID: process.env.STRIPE_PRO_PLAN_PRICE_ID ?? "(not set)",
      STRIPE_TEAM_MEMBER_ADDON_PRICE_ID: process.env.STRIPE_TEAM_MEMBER_ADDON_PRICE_ID ?? "(not set)",
    },
  });
}
