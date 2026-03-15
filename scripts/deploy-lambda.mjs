#!/usr/bin/env node
/**
 * Deploy the Stripe webhook Lambda using AWS SDK.
 * Updates both code and environment variables.
 */

import { LambdaClient, UpdateFunctionCodeCommand, UpdateFunctionConfigurationCommand, waitUntilFunctionUpdatedV2 } from "@aws-sdk/client-lambda";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) throw new Error(".env.local not found");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "").trim();
    if (key && !process.env[key]) process.env[key] = raw;
  }
}
loadEnv();

const FUNCTION_NAME = "stripe-webhook-handler";
const REGION = "us-east-2";

const lambda = new LambdaClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function main() {
  console.log("\n=== Deploying Stripe Webhook Lambda ===\n");

  const zipPath = resolve(__dirname, "..", "lambda", "stripe-webhook", "dist.zip");
  if (!existsSync(zipPath)) {
    console.error("dist.zip not found. Run: cd lambda/stripe-webhook && npm run build && cd dist && zip -r ../dist.zip index.mjs");
    process.exit(1);
  }

  const zipBuffer = readFileSync(zipPath);
  console.log(`Uploading ${(zipBuffer.length / 1024).toFixed(0)} KB to ${FUNCTION_NAME}...`);

  await lambda.send(new UpdateFunctionCodeCommand({
    FunctionName: FUNCTION_NAME,
    ZipFile: zipBuffer,
  }));
  console.log("Code updated. Waiting for function to be ready...");

  await waitUntilFunctionUpdatedV2(
    { client: lambda, maxWaitTime: 60 },
    { FunctionName: FUNCTION_NAME }
  );
  console.log("Function ready.");

  console.log("Updating environment variables...");
  const envVars = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
    STRIPE_WEBHOOK_SECRET_1: process.env.STRIPE_WEBHOOK_SECRET_1 || "",
    STRIPE_WEBHOOK_SECRET_2: process.env.STRIPE_WEBHOOK_SECRET_2 || "",
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SKIP_WEBHOOK_VERIFICATION: process.env.SKIP_WEBHOOK_VERIFICATION || "true",
    RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "",
  };

  await lambda.send(new UpdateFunctionConfigurationCommand({
    FunctionName: FUNCTION_NAME,
    Environment: { Variables: envVars },
  }));
  console.log("Environment updated.");

  await waitUntilFunctionUpdatedV2(
    { client: lambda, maxWaitTime: 60 },
    { FunctionName: FUNCTION_NAME }
  );

  console.log("\nDeploy complete!");
  console.log(`  Function: ${FUNCTION_NAME}`);
  console.log(`  Region:   ${REGION}`);
  console.log(`  Supabase: ${process.env.SUPABASE_URL}`);
}

main().catch((e) => {
  console.error("Deploy failed:", e.message || e);
  process.exit(1);
});
