#!/usr/bin/env node
/**
 * Test Stripe webhook Lambda with a properly signed request.
 * Uses STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET from .env.local.
 * Usage: node --env-file=.env.local scripts/test-webhook.mjs [webhook-url]
 */

import Stripe from "stripe";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const WEBHOOK_URL =
  process.argv[2] ||
  "https://ldw5gnhkxfxamc73olftnaj5iy0uecfc.lambda-url.us-east-2.on.aws/";

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

// Minimal payment_intent.succeeded payload (Stripe event format)
const payload = {
  id: "evt_test_webhook_" + Date.now(),
  object: "event",
  api_version: "2023-10-16",
  created: Math.floor(Date.now() / 1000),
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: "pi_test_" + Date.now(),
      object: "payment_intent",
      amount: 2000,
      amount_received: 2000,
      currency: "usd",
      latest_charge: "ch_test_" + Date.now(),
      metadata: {},
      status: "succeeded",
    },
  },
};

const payloadString = JSON.stringify(payload);
const header = stripe.webhooks.generateTestHeaderString({
  payload: payloadString,
  secret: webhookSecret,
});

console.log("Sending signed webhook to", WEBHOOK_URL);

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

if (res.ok) {
  console.log("\nWebhook accepted (200). Stripe would see this as successful.");
} else {
  console.log("\nWebhook returned", res.status, "- check Lambda logs for details.");
  process.exit(1);
}
