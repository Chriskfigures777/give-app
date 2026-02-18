#!/usr/bin/env node
/**
 * Send a test Connect webhook (payment_intent.succeeded from a Connect account) to Lambda.
 * The event includes "account" field so Lambda receives it as a Connect event.
 * Usage: node --env-file=.env.local scripts/test-connect-webhook.mjs [webhook-url] [connect-account-id]
 */

import Stripe from "stripe";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const LAMBDA_URL =
  "https://ldw5gnhkxfxamc73olftnaj5iy0uecfc.lambda-url.us-east-2.on.aws/";
const WEBHOOK_URL = process.argv[2] || LAMBDA_URL;
const CONNECT_ACCOUNT = process.argv[3] || "acct_1T06tHKBPzPEChwI";

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

const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET ||
  process.env.STRIPE_WEBHOOK_SECRET_1 ||
  process.env.STRIPE_WEBHOOK_SECRET_2;

if (!webhookSecret) {
  console.error("Missing STRIPE_WEBHOOK_SECRET in .env.local");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_x", {
  apiVersion: "2026-01-28.clover",
});

// Connect event: includes "account" to identify the Connect account
const payload = {
  id: "evt_connect_test_" + Date.now(),
  object: "event",
  api_version: "2023-10-16",
  created: Math.floor(Date.now() / 1000),
  type: "payment_intent.succeeded",
  account: CONNECT_ACCOUNT,
  data: {
    object: {
      id: "pi_connect_test_" + Date.now(),
      object: "payment_intent",
      amount: 1000,
      amount_received: 1000,
      currency: "usd",
      latest_charge: "ch_connect_test_" + Date.now(),
      metadata: {
        organization_id: "feb84d4c-1979-4e5e-bacc-e488c4215332",
        donation_amount_cents: "1000",
        donor_email: "test@example.com",
        donor_name: "Test Donor",
        splits: JSON.stringify([{ percentage: 50, accountId: "acct_1T1ECdK9xLjh28vi" }]),
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

console.log("Sending Connect webhook to", WEBHOOK_URL);
console.log("  account:", CONNECT_ACCOUNT);
console.log("  type: payment_intent.succeeded");

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
  console.log("\nConnect webhook accepted. Check Lambda CloudWatch logs for event processing.");
} else {
  console.log("\nWebhook returned", res.status, "- check Lambda logs for details.");
  process.exit(1);
}
