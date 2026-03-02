#!/usr/bin/env node
/**
 * Deploy Feed webhook Lambda via AWS SDK.
 * Prerequisites: AWS credentials, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Usage: node scripts/deploy-feed-webhook.mjs [region]
 * After deploy: node scripts/create-feed-webhook-url.mjs [region]
 * Then configure Supabase Database Webhooks to POST to the Function URL.
 */

import { LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand, UpdateFunctionConfigurationCommand, GetFunctionCommand } from "@aws-sdk/client-lambda";
import { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, GetRoleCommand } from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const REGION = process.env.AWS_REGION || process.argv[2] || "us-east-2";
const FUNCTION_NAME = "feed-webhook-handler";
const ROLE_NAME = "feed-webhook-lambda-role";

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
    await new Promise((r) => setTimeout(r, 10000));
    return `arn:aws:iam::${accountId}:role/${ROLE_NAME}`;
  }
}

async function main() {
  loadEnv();

  const credentials = getAwsCredentials();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const lambda = new LambdaClient({ region: REGION, credentials });
  const iam = new IAMClient({ region: REGION, credentials });
  const accountId = process.env.AWS_ACCOUNT_ID || (await getAccountId(credentials));
  const roleArn = await ensureRole(iam, accountId);

  const zipPath = resolve(__dirname, "..", "lambda", "feed-webhook", "dist.zip");
  if (!existsSync(zipPath)) {
    console.error("Run: cd lambda/feed-webhook && pnpm install && pnpm run deploy");
    process.exit(1);
  }

  const zipBuffer = readFileSync(zipPath);
  const env = {
    Variables: {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
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

  console.log("\nNext: node scripts/create-feed-webhook-url.mjs");
  console.log("Then configure Supabase Database Webhooks: donations INSERT, peer_requests INSERT, organizations INSERT");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
