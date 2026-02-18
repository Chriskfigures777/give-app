#!/usr/bin/env node
/**
 * Create Lambda Function URL for Stripe webhook (public HTTPS endpoint).
 * Run after deploy:lambda. Usage: node scripts/create-lambda-url.mjs [region]
 */

import {
  LambdaClient,
  CreateFunctionUrlConfigCommand,
  GetFunctionUrlConfigCommand,
  AddPermissionCommand,
} from "@aws-sdk/client-lambda";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGION = process.env.AWS_REGION || process.argv[2] || "us-east-2";
const FUNCTION_NAME = "stripe-webhook-handler";

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

async function main() {
  loadEnv();
  const credentials = getAwsCredentials();

  const lambda = new LambdaClient({ region: REGION, credentials });

  // Create or get Function URL
  let functionUrl;
  try {
    const existing = await lambda.send(
      new GetFunctionUrlConfigCommand({ FunctionName: FUNCTION_NAME })
    );
    functionUrl = existing.FunctionUrl;
    console.log("Function URL already exists:", functionUrl);
  } catch (e) {
    if (e.name === "ResourceNotFoundException") {
      const created = await lambda.send(
        new CreateFunctionUrlConfigCommand({
          FunctionName: FUNCTION_NAME,
          AuthType: "NONE",
        })
      );
      functionUrl = created.FunctionUrl;
      console.log("Created Function URL:", functionUrl);

      // Add permissions for public invoke (required for AuthType NONE)
      try {
        await lambda.send(
          new AddPermissionCommand({
            FunctionName: FUNCTION_NAME,
            StatementId: "UrlPolicyInvokeURL",
            Action: "lambda:InvokeFunctionUrl",
            Principal: "*",
            FunctionUrlAuthType: "NONE",
          })
        );
        await lambda.send(
          new AddPermissionCommand({
            FunctionName: FUNCTION_NAME,
            StatementId: "UrlPolicyInvokeFunction",
            Action: "lambda:InvokeFunction",
            Principal: "*",
            InvokedViaFunctionUrl: true,
          })
        );
        console.log("Added public invoke permissions");
      } catch (permErr) {
        if (permErr.name === "ResourceConflictException") {
          console.log("Permissions already exist");
        } else throw permErr;
      }
    } else throw e;
  }

  console.log("\n--- Next steps ---");
  console.log("1. Create Connect webhook (required for direct charges / Connect account events):");
  console.log("   pnpm run create:connect-webhook");
  console.log("   Or in Stripe Dashboard: Add endpoint → Listen to: 'Events on Connected accounts'");
  console.log("   Endpoint URL:", functionUrl);
  console.log("\n2. Select events: payment_intent.succeeded, payment_intent.payment_failed,");
  console.log("   checkout.session.completed, invoice.paid, customer.subscription.updated,");
  console.log("   customer.subscription.deleted, account.updated");
  console.log("\n3. Test with Stripe CLI (Connect events):");
  console.log("   stripe listen --forward-connect-to", functionUrl);
  console.log("   stripe trigger payment_intent.succeeded --stripe-account acct_xxx");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
