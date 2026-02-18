#!/usr/bin/env node
/**
 * Create a Stripe Connect webhook endpoint (listens to events on connected accounts).
 * Required for direct charges and Connect account activity - regular webhooks only
 * receive platform-level events.
 *
 * Usage: node --env-file=.env.local scripts/create-connect-webhook.mjs [lambda-url]
 * If lambda-url is omitted, fetches it from AWS.
 */

import Stripe from "stripe";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  LambdaClient,
  GetFunctionUrlConfigCommand,
} from "@aws-sdk/client-lambda";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGION = process.env.AWS_REGION || "us-east-2";
const FUNCTION_NAME = "stripe-webhook-handler";

const CONNECT_EVENTS = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "account.updated",
  "payout.paid",
];

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

async function getLambdaUrl() {
  const id = process.env.AWS_ACCESS_KEY_ID || process.env.AWSAccesskey;
  const secret = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWSSecretaccesskey;
  if (!id || !secret) return null;
  const lambda = new LambdaClient({
    region: REGION,
    credentials: { accessKeyId: id, secretAccessKey: secret },
  });
  try {
    const res = await lambda.send(
      new GetFunctionUrlConfigCommand({ FunctionName: FUNCTION_NAME })
    );
    return res.FunctionUrl;
  } catch {
    return null;
  }
}

async function main() {
  loadEnv();

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY not found in .env.local");
    process.exit(1);
  }

  const endpointUrl = process.argv[2] || (await getLambdaUrl());
  if (!endpointUrl) {
    console.error(
      "Could not get Lambda URL. Pass it as argument:\n" +
        "  node scripts/create-connect-webhook.mjs https://xxx.lambda-url.us-east-2.on.aws/"
    );
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);

  // List existing Connect webhooks
  const { data: endpoints } = await stripe.webhookEndpoints.list({
    limit: 100,
  });

  const connectEndpoint = endpoints.find(
    (e) => e.url === endpointUrl && e.enabled && e.connect === true
  );
  if (connectEndpoint) {
    console.log("Connect webhook already exists:", connectEndpoint.id);
    console.log("  URL:", connectEndpoint.url);
    console.log("  Signing secret: (check Stripe Dashboard for whsec_...)");
    return;
  }

  const existingAccountWebhook = endpoints.find(
    (e) => e.url === endpointUrl && e.enabled
  );
  if (existingAccountWebhook) {
    console.log("Found existing webhook but it's NOT a Connect webhook.");
    console.log("Creating a new Connect webhook (you may want to disable the old one)...");
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: endpointUrl,
    enabled_events: CONNECT_EVENTS,
    connect: true, // <-- This makes it a Connect webhook (events on connected accounts)
    description: "Lambda - Connect account events (direct charges, splits)",
  });

  console.log("\nConnect webhook created successfully!");
  console.log("  ID:", endpoint.id);
  console.log("  URL:", endpoint.url);
  console.log("  connect: true (events on connected accounts)");
  console.log("\n--- Add to .env.local ---");
  console.log("STRIPE_WEBHOOK_SECRET=" + endpoint.secret);
  console.log("\nThen redeploy Lambda: pnpm run deploy:lambda");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
