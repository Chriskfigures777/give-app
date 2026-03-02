#!/usr/bin/env node
/**
 * Test internal splits: simulate payment_intent.succeeded webhook for an org with internal_splits.
 * Sends to local Next.js webhook (default) or provided URL.
 *
 * Note: Payouts require AVAILABLE balance. Simulated webhooks won't have real funds.
 * For a full test, make a real donation at /give/[slug] with Stripe test card 4242 4242 4242 4242.
 *
 * Usage: pnpm dev (in another terminal), then:
 *   node --env-file=.env.local scripts/test-internal-splits.mjs [webhook-url]
 *   node --env-file=.env.local scripts/test-internal-splits.mjs http://localhost:3000/api/webhooks/stripe
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const WEBHOOK_URL =
  process.argv[2] || "http://localhost:3000/api/webhooks/stripe";

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

if (!stripeSecretKey || !webhookSecret) {
  console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET in .env.local");
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });
const supabase = createClient(supabaseUrl, supabaseKey);

// Find org with internal_splits configured
const { data: orgRow, error: orgError } = await supabase
  .from("organizations")
  .select("id, name, slug, stripe_connect_account_id")
  .not("stripe_connect_account_id", "is", null)
  .limit(20);

const orgs = orgRow || [];
const { data: fcRows } = await supabase
  .from("form_customizations")
  .select("organization_id, internal_splits")
  .not("internal_splits", "is", null);

const orgsWithSplits = new Map(
  (fcRows || [])
    .filter((r) => Array.isArray(r.internal_splits) && r.internal_splits.length > 0)
    .map((r) => [r.organization_id, r.internal_splits])
);

const org = orgs.find((o) => orgsWithSplits.has(o.id));
if (!org) {
  console.error("No organization with internal_splits found. Configure splits in Settings > Split to bank accounts.");
  process.exit(1);
}

const internalSplits = orgsWithSplits.get(org.id);
console.log("\nTesting internal splits for:", org.name, `(${org.slug})`);
console.log("Splits:", JSON.stringify(internalSplits, null, 2));

const amountCents = 10000; // $100
const applicationFeeCents = 0;

const piId = "pi_test_internal_" + Date.now();
const chId = "ch_test_internal_" + Date.now();

const payload = {
  id: "evt_test_internal_" + Date.now(),
  object: "event",
  api_version: "2023-10-16",
  created: Math.floor(Date.now() / 1000),
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: piId,
      object: "payment_intent",
      amount: amountCents,
      amount_received: amountCents,
      currency: "usd",
      latest_charge: chId,
      metadata: {
        organization_id: org.id,
        donation_amount_cents: String(amountCents),
        application_fee_cents: String(applicationFeeCents),
        donor_email: "test@example.com",
        donor_name: "Test Donor",
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

console.log("\nSending webhook to", WEBHOOK_URL);
console.log("Amount: $", (amountCents / 100).toFixed(2));
console.log("Expected splits:", internalSplits.map((s) => `${s.percentage}% → ${s.externalAccountId}`).join(", "));

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

console.log("\nStatus:", res.status);
console.log("Response:", typeof body === "object" ? JSON.stringify(body, null, 2) : body);

if (res.ok) {
  console.log("\n✓ Webhook accepted.");
  console.log("\nNote: Payouts may fail with 'Insufficient funds' because simulated payments");
  console.log("don't add real balance. For a full test, make a real donation at:");
  console.log(`  http://localhost:3000/give/${org.slug}`);
  console.log("  Use test card: 4242 4242 4242 4242");
} else {
  console.log("\n✗ Webhook returned", res.status);
  process.exit(1);
}
