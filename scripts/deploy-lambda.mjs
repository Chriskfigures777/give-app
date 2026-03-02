#!/usr/bin/env node
/**
 * Deploy Stripe webhook Lambda via AWS SDK.
 * Prerequisites: AWS credentials (env or ~/.aws/credentials), env vars for Stripe/Supabase
 * Usage: node scripts/deploy-lambda.mjs [region]
 */

import { LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand, UpdateFunctionConfigurationCommand, GetFunctionCommand } from "@aws-sdk/client-lambda";
import { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, GetRoleCommand } from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const REGION = process.env.AWS_REGION || process.argv[2] || "us-east-2";
const FUNCTION_NAME = "stripe-webhook-handler";
const ROLE_NAME = "stripe-webhook-lambda-role";

async function getAccountId(credentials) {
  const sts = new STSClient({ region: REGION, credentials });
  const { Account } = await sts.send(new GetCallerIdentityCommand({}));
  return Account;
}

function loadEnv() {
  const projectRoot = resolve(__dirname, "..");
  for (const base of [projectRoot, process.cwd()]) {
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
  if (!process.env.AWS_ACCESS_KEY_ID && process.env.AWSAccesskey) {
    process.env.AWS_ACCESS_KEY_ID = process.env.AWSAccesskey;
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY && process.env.AWSSecretaccesskey) {
    process.env.AWS_SECRET_ACCESS_KEY = process.env.AWSSecretaccesskey;
  }
}

function getAwsCredentials() {
  const id = process.env.AWS_ACCESS_KEY_ID;
  const secret = process.env.AWS_SECRET_ACCESS_KEY;
  if (!id || !secret) {
    throw new Error("AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local");
  }
  return { accessKeyId: id, secretAccessKey: secret };
}

async function ensureRole(iam, accountId) {
  try {
    await iam.send(new GetRoleCommand({ RoleName: ROLE_NAME }));
    return `arn:aws:iam::${accountId}:role/${ROLE_NAME}`;
  } catch {
    // Create role
    await iam.send(
      new CreateRoleCommand({
        RoleName: ROLE_NAME,
        AssumeRolePolicyDocument: JSON.stringify({
          Version: "2012-10-17",
          Statement: [{ Effect: "Allow", Principal: { Service: "lambda.amazonaws.com" }, Action: "sts:AssumeRole" }],
        }),
      })
    );
    await iam.send(
      new AttachRolePolicyCommand({
        RoleName: ROLE_NAME,
        PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      })
    );
    console.log("Created IAM role", ROLE_NAME);
    await new Promise((r) => setTimeout(r, 10000)); // Wait for propagation
    return `arn:aws:iam::${accountId}:role/${ROLE_NAME}`;
  }
}

async function main() {
  loadEnv();

  const credentials = getAwsCredentials();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET_1;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const skipVerification =
    process.env.SKIP_WEBHOOK_VERIFICATION === "true" || process.env.SKIP_WEBHOOK_VERIFICATION === "1";

  if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  if (!webhookSecret && !skipVerification) {
    console.error("Missing STRIPE_WEBHOOK_SECRET. Set it or use SKIP_WEBHOOK_VERIFICATION=true for testing.");
    process.exit(1);
  }

  const lambda = new LambdaClient({ region: REGION, credentials });
  const iam = new IAMClient({ region: REGION, credentials });

  const accountId = process.env.AWS_ACCOUNT_ID || (await getAccountId(credentials));

  const roleArn = await ensureRole(iam, accountId);

  const zipPath = resolve(__dirname, "..", "lambda", "stripe-webhook", "dist.zip");
  if (!existsSync(zipPath)) {
    console.error("Run: cd lambda/stripe-webhook && pnpm run deploy");
    process.exit(1);
  }

  const zipBuffer = readFileSync(zipPath);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.DOMAIN || "";
  const resendKey =
    process.env.RESEND_API_KEY?.trim() ||
    process.env.Resend_API_Key?.trim() ||
    "";

  if (!resendKey) {
    console.warn("RESEND_API_KEY not set – Lambda will not send donation/receipt emails.");
  } else {
    console.log("RESEND_API_KEY will be passed to Lambda (emails enabled).");
  }

  if (skipVerification) {
    console.warn("SKIP_WEBHOOK_VERIFICATION=true – signature verification disabled (testing only).");
  }

  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim() || "";

  const env = {
    Variables: {
      STRIPE_SECRET_KEY: stripeKey,
      STRIPE_PUBLISHABLE_KEY: stripePublishableKey || "",
      ...(process.env.STRIPE_WEBHOOK_SECRET && { STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET }),
      ...(process.env.STRIPE_WEBHOOK_SECRET_1 && { STRIPE_WEBHOOK_SECRET_1: process.env.STRIPE_WEBHOOK_SECRET_1 }),
      ...(process.env.STRIPE_WEBHOOK_SECRET_2 && { STRIPE_WEBHOOK_SECRET_2: process.env.STRIPE_WEBHOOK_SECRET_2 }),
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
      ...(appUrl && { NEXT_PUBLIC_APP_URL: appUrl }),
      ...(resendKey && { RESEND_API_KEY: resendKey }),
      ...(resendFrom && { RESEND_FROM_EMAIL: resendFrom }),
      ...(skipVerification && { SKIP_WEBHOOK_VERIFICATION: "1" }),
    },
  };

  async function waitForLambdaReady() {
    for (let i = 0; i < 12; i++) {
      const res = await lambda.send(new GetFunctionCommand({ FunctionName: FUNCTION_NAME }));
      const status = res.Configuration?.LastUpdateStatus;
      if (status === "Successful" || status === "Failed") return status;
      await new Promise((r) => setTimeout(r, 5000));
    }
    throw new Error("Lambda update timed out");
  }

  async function withRetry(fn) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await fn();
      } catch (e) {
        if (e.name === "ResourceConflictException" && attempt < 3) {
          const delay = attempt * 10000;
          console.log(`Lambda update in progress, retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw e;
        }
      }
    }
  }

  try {
    await lambda.send(new GetFunctionCommand({ FunctionName: FUNCTION_NAME }));
    console.log("Updating Lambda", FUNCTION_NAME);
    await waitForLambdaReady();
    await withRetry(() =>
      lambda.send(new UpdateFunctionCodeCommand({
        FunctionName: FUNCTION_NAME,
        ZipFile: zipBuffer,
      }))
    );
    await waitForLambdaReady();
    await withRetry(() =>
      lambda.send(new UpdateFunctionConfigurationCommand({
        FunctionName: FUNCTION_NAME,
        Runtime: "nodejs22.x",
        Handler: "index.handler",
        Timeout: 30,
        MemorySize: 256,
        Environment: env,
      }))
    );
    console.log("Lambda updated successfully");
  } catch (e) {
    if (e.name === "ResourceNotFoundException") {
      console.log("Creating Lambda", FUNCTION_NAME);
      await lambda.send(
        new CreateFunctionCommand({
          FunctionName: FUNCTION_NAME,
          Runtime: "nodejs22.x",
          Role: roleArn,
          Handler: "index.handler",
          Code: { ZipFile: zipBuffer },
          Timeout: 30,
          MemorySize: 256,
          Environment: env,
        })
      );
      console.log("Lambda created successfully");
    } else {
      throw e;
    }
  }

  console.log("Create a Function URL or API Gateway endpoint and point Stripe webhook to it.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
