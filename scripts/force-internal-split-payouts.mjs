#!/usr/bin/env node
/**
 * Force internal split payouts by:
 * 1. Destination charge with tok_bypassPending (4000000000000077) - funds go directly to connected account as available balance
 * 2. Creating payouts to each internal split bank account
 *
 * Test mode only. Usage: node --env-file=.env.local scripts/force-internal-split-payouts.mjs [amount_cents]
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AMOUNT_CENTS = parseInt(process.argv[2] || "10000", 10); // $100 default

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

// Get GOMAke org with internal_splits
const { data: org } = await supabase
  .from("organizations")
  .select("id, name, stripe_connect_account_id")
  .eq("slug", "gomake")
  .single();

if (!org?.stripe_connect_account_id) {
  console.error("GOMAke org or Connect account not found");
  process.exit(1);
}

const { data: fc } = await supabase
  .from("form_customizations")
  .select("internal_splits")
  .eq("organization_id", org.id)
  .single();

const internalSplits = fc?.internal_splits;
if (!Array.isArray(internalSplits) || internalSplits.length === 0) {
  console.error("No internal_splits configured for GOMAke");
  process.exit(1);
}

const connectAccountId = org.stripe_connect_account_id;
console.log("\nForce internal split payouts for", org.name);
console.log("Amount: $" + (AMOUNT_CENTS / 100).toFixed(2));
console.log("Splits:", internalSplits.map((s) => `${s.percentage}%`).join(", "));

// 1. Destination charge: funds go directly to connected account (tok_bypassPending = available balance)
console.log("\n1. Creating destination charge to connected account (tok_bypassPending)...");
const charge = await stripe.charges.create({
  amount: AMOUNT_CENTS,
  currency: "usd",
  source: "tok_bypassPending",
  transfer_data: { destination: connectAccountId },
  description: "Test charge for internal split payouts",
});
console.log("   Charge created:", charge.id);

// 2. Create payouts to each internal split account
console.log("\n2. Creating payouts to bank accounts...");
const amountToSplit = AMOUNT_CENTS; // Full amount went to connected account

for (const s of internalSplits) {
  const amt = Math.round((s.percentage / 100) * amountToSplit);
  if (amt < 1 || !s.externalAccountId) continue;
  try {
    const payout = await stripe.payouts.create(
      {
        amount: amt,
        currency: "usd",
        destination: s.externalAccountId,
      },
      { stripeAccount: connectAccountId }
    );
    console.log(`   ${s.percentage}% → $${(amt / 100).toFixed(2)} (payout ${payout.id})`);
  } catch (e) {
    console.error(`   ${s.percentage}% failed:`, e.message);
  }
}

console.log("\nDone. Check Stripe Dashboard → Connect → GOMAke → Payouts.");
