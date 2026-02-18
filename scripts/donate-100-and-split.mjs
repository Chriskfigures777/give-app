#!/usr/bin/env node
/**
 * Make a real $100 donation to GOMAke and trigger internal splits.
 * Uses create-payment-intent API + Stripe confirm.
 *
 * Prerequisites: pnpm dev running, Stripe test mode.
 * Usage: node --env-file=.env.local scripts/donate-100-and-split.mjs [base-url]
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.argv[2] || "http://localhost:3000";

function loadEnv() {
  for (const base of [process.cwd(), resolve(__dirname, "..")]) {
    const envPath = resolve(base, ".env.local");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        const raw = trimmed.slice(eq + 1).trim();
        const value = raw.replace(/^["']|["']$/g, "").trim();
        if (key && !process.env[key]) process.env[key] = value;
      }
      break;
    }
  }
}

loadEnv();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey || !supabaseUrl || !supabaseKey) {
  console.error("Missing STRIPE_SECRET_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });
const supabase = createClient(supabaseUrl, supabaseKey);

// Get org with internal_splits (gomake)
const { data: org } = await supabase
  .from("organizations")
  .select("id, name, slug")
  .eq("slug", "gomake")
  .single();

if (!org) {
  console.error("Organization gomake not found");
  process.exit(1);
}

const orgId = org.id;
console.log("\nMaking $100 donation to", org.name);

// 1. Create PaymentIntent via API
const piRes = await fetch(`${BASE_URL}/api/create-payment-intent`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amountCents: 10000,
    organizationId: orgId,
    donorEmail: "test-split@example.com",
    donorName: "Test Split Donor",
    feeCoverage: "org_pays",
    paymentFrequency: "one_time",
  }),
});

const piData = await piRes.json();
if (!piRes.ok) {
  console.error("Create payment intent failed:", piData);
  process.exit(1);
}

const { clientSecret, paymentIntentId, stripeConnectAccountId } = piData;
if (!clientSecret) {
  console.error("No clientSecret in response:", piData);
  process.exit(1);
}

console.log("PaymentIntent created:", paymentIntentId);

// 2. Confirm with Stripe test payment method (pm_card_visa = 4242...)
await stripe.paymentIntents.confirm(
  paymentIntentId,
  {
    payment_method: "pm_card_visa",
    return_url: `${BASE_URL}/give/gomake`,
  },
  stripeConnectAccountId ? { stripeAccount: stripeConnectAccountId } : {}
);

console.log("Payment confirmed. Waiting for webhook...");

// 3. Poll for donation record (webhook creates it)
for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  const { data: don } = await supabase
    .from("donations")
    .select("id, amount_cents")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (don) {
    console.log("Donation recorded:", don.id, "$" + (don.amount_cents / 100).toFixed(2));
    break;
  }
  if (i === 19) console.log("Donation not yet in DB (webhook may be delayed)");
}

// 4. Check internal_split_payouts
const { data: payouts } = await supabase
  .from("internal_split_payouts")
  .select("id")
  .eq("stripe_payment_intent_id", paymentIntentId);

console.log(
  payouts?.length
    ? `\n✓ Internal split payouts created: ${payouts.length}`
    : "\nNote: internal_split_payouts may be empty if payouts failed (e.g. funds not yet available). Check Stripe Dashboard → Connect → GOMAke account → Payouts."
);

console.log("\nDone. Check Stripe Dashboard for payouts to both bank accounts.");
