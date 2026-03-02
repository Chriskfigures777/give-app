#!/usr/bin/env node
/**
 * Verify internal splits against Stripe: list external accounts and recent payouts.
 * Usage: node --env-file=.env.local scripts/verify-internal-splits-stripe.mjs
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
console.log("\n=== Stripe data for GOMAke internal splits ===\n");
console.log("Connected account:", connectAccountId);

// 1. List external accounts from Stripe
const accounts = await stripe.accounts.listExternalAccounts(connectAccountId, {
  object: "bank_account",
  limit: 20,
});

console.log("\n--- Bank accounts on connected account (from Stripe) ---");
const stripeBankIds = new Set();
for (const acc of accounts.data) {
  stripeBankIds.add(acc.id);
  const last4 = acc.last4 ?? "????";
  const bankName = acc.bank_name ?? "Unknown";
  console.log(`  ${acc.id}  last4: ${last4}  ${bankName}`);
}

// 2. Verify internal_splits reference valid Stripe accounts
console.log("\n--- Internal splits config (from DB) vs Stripe ---");
let allValid = true;
for (const s of internalSplits) {
  const exists = stripeBankIds.has(s.externalAccountId);
  if (!exists) {
    allValid = false;
    console.log(`  ${s.percentage}% → ${s.externalAccountId}  ❌ NOT FOUND on Stripe`);
  } else {
    console.log(`  ${s.percentage}% → ${s.externalAccountId}  ✓ exists on Stripe`);
  }
}

// 3. Recent payouts
const payouts = await stripe.payouts.list(
  { limit: 10 },
  { stripeAccount: connectAccountId }
);
console.log("\n--- Recent payouts (from Stripe) ---");
for (const p of payouts.data) {
  const dest = p.destination ?? p.destination_payment_method ?? "default";
  console.log(`  ${p.id}  $${(p.amount / 100).toFixed(2)}  dest: ${dest}  status: ${p.status}`);
}

console.log("\n" + (allValid ? "✓ All internal split accounts exist on Stripe." : "⚠ Some accounts missing on Stripe."));
