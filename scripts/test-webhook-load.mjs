#!/usr/bin/env node
/**
 * Send concurrent signed Stripe webhook requests to test Lambda load.
 * Usage: node --env-file=.env.local scripts/test-webhook-load.mjs [webhook-url] [count]
 * Example: node --env-file=.env.local scripts/test-webhook-load.mjs "" 100
 *
 * Note: New AWS accounts have low concurrency limits (~10). Use count=10 for all-success,
 * or 100 to test throughput (some may get 429 throttle).
 */

import Stripe from "stripe";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_URL = "https://ldw5gnhkxfxamc73olftnaj5iy0uecfc.lambda-url.us-east-2.on.aws/";
const args = process.argv.slice(2).filter((a) => a !== "--");
const urlArg = args.find((a) => a.startsWith("http"));
const countArg = args.find((a) => /^\d+$/.test(a));
const WEBHOOK_URL = urlArg || DEFAULT_URL;
const COUNT = parseInt(countArg || "100", 10);

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

if (!stripeSecretKey || !webhookSecret) {
  console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET in .env.local");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });

function createPayload(i) {
  const ts = Date.now();
  return {
    id: `evt_test_load_${ts}_${i}`,
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(ts / 1000),
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: `pi_test_load_${ts}_${i}`,
        object: "payment_intent",
        amount: 2000,
        amount_received: 2000,
        currency: "usd",
        latest_charge: `ch_test_load_${ts}_${i}`,
        metadata: {},
        status: "succeeded",
      },
    },
  };
}

async function sendRequest(i) {
  const payload = createPayload(i);
  const payloadString = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret: webhookSecret,
  });

  const start = performance.now();
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": header,
    },
    body: payloadString,
  });
  const elapsed = performance.now() - start;

  const text = await res.text();
  return { i, status: res.status, elapsed, ok: res.ok };
}

console.log(`Sending ${COUNT} concurrent signed webhook requests to ${WEBHOOK_URL}...\n`);

const startTotal = performance.now();
const results = await Promise.all(Array.from({ length: COUNT }, (_, i) => sendRequest(i)));
const totalElapsed = performance.now() - startTotal;

const ok = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);
const statusCounts = {};
results.forEach((r) => {
  statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
});

console.log("--- Results ---");
console.log(`Total time: ${(totalElapsed / 1000).toFixed(2)}s`);
console.log(`Success (200): ${ok}/${COUNT}`);
console.log(`Failed: ${failed.length}/${COUNT}`);
console.log(`Status codes:`, statusCounts);
console.log(`Throughput: ${(COUNT / (totalElapsed / 1000)).toFixed(1)} req/s`);

if (failed.length > 0) {
  console.log("\nFirst 5 failures:", failed.slice(0, 5));
  if (statusCounts[429]) {
    console.log("\nTip: 429 = Lambda throttled. New accounts have ~10 concurrent limit.");
    console.log("     Run with count=10 for all-success, or request a quota increase in AWS.");
  }
  process.exit(1);
}

console.log("\nAll requests succeeded.");
