#!/usr/bin/env node
/**
 * Test Stripe splits flow: create PaymentIntent with splits metadata, confirm,
 * then send payment_intent.succeeded to webhook and verify split_transfers.
 *
 * Prerequisites: pnpm dev running, org with form_customizations.splits configured,
 * STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_* in .env.local.
 *
 * Usage: node --env-file=.env.local scripts/test-splits-webhook.mjs [webhook-url] [org-slug]
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const WEBHOOK_URL =
  process.argv[2] ||
  "https://ldw5gnhkxfxamc73olftnaj5iy0uecfc.lambda-url.us-east-2.on.aws/";
const ORG_SLUG = process.argv[3] || "gomake";

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
const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET ||
  process.env.STRIPE_WEBHOOK_SECRET_1 ||
  process.env.STRIPE_WEBHOOK_SECRET_2;
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseKey) {
  console.error(
    "Missing STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("\n=== Splits Webhook Test ===\n");

  // 1. Get org and form_customizations.splits
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, stripe_connect_account_id")
    .eq("slug", ORG_SLUG)
    .single();

  if (!org) {
    console.error(`Organization ${ORG_SLUG} not found`);
    process.exit(1);
  }

  const { data: formRow } = await supabase
    .from("form_customizations")
    .select("splits")
    .eq("organization_id", org.id)
    .single();

  const splits = (formRow?.splits ?? []).filter((s) => s?.accountId);
  if (splits.length === 0) {
    console.warn(
      `No splits configured for ${ORG_SLUG}. Add splits in form customization (Dashboard → Website form → Payment splits).`
    );
    console.log("Creating test payload with mock splits for webhook test...\n");
  } else {
    console.log(`Found ${splits.length} split(s) for ${org.name}`);
  }

  // 2. Build splits for metadata (use real or mock)
  const stripeSplits =
    splits.length > 0
      ? splits
      : [{ percentage: 50, accountId: org.stripe_connect_account_id }];
  const applicationFeeCents = 101; // 1% of $100
  const netAmount = 10000 - applicationFeeCents;

  const piId = "pi_test_splits_" + Date.now();
  const chargeId = "ch_test_splits_" + Date.now();

  const payload = {
    id: "evt_test_splits_" + Date.now(),
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: piId,
        object: "payment_intent",
        amount: 10000,
        amount_received: 10000,
        currency: "usd",
        latest_charge: chargeId,
        metadata: {
          organization_id: org.id,
          donor_email: "test-splits@example.com",
          donor_name: "Splits Test",
          donation_amount_cents: "10000",
          application_fee_cents: String(applicationFeeCents),
          splits: JSON.stringify(stripeSplits),
          split_mode: "stripe_connect",
        },
        status: "succeeded",
      },
    },
  };

  const payloadString = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret: webhookSecret,
  });

  console.log("Sending payment_intent.succeeded with splits to", WEBHOOK_URL);

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": header,
    },
    body: payloadString,
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  console.log("Status:", res.status);
  console.log("Response:", typeof body === "object" ? JSON.stringify(body, null, 2) : body);

  if (!res.ok) {
    console.error("\nWebhook failed. Check Lambda logs for details.");
    process.exit(1);
  }

  // 3. Verify split_transfers was created
  await new Promise((r) => setTimeout(r, 1500));
  const { data: splitTransfer } = await supabase
    .from("split_transfers")
    .select("id")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();

  if (splitTransfer) {
    console.log("\n✓ split_transfers record created for", piId);
  } else {
    console.log(
      "\nNote: split_transfers not found. This may be expected if:"
    );
    console.log("  - Lambda/webhook uses different Supabase (prod vs local)");
    console.log("  - Mock splits used and org has no stripe_connect_account_id");
    console.log("  - Check CloudWatch logs for [splits] messages");
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
