#!/usr/bin/env node
/**
 * Create Lambda Function URL for Feed webhook (for Supabase Database Webhooks).
 * Run after deploy-feed-webhook. Usage: node scripts/create-feed-webhook-url.mjs [region]
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
const FUNCTION_NAME = "feed-webhook-handler";

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

  // Update app_config in Supabase so pg_net triggers use this URL
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from("app_config").upsert(
        { key: "feed_webhook_url", value: functionUrl },
        { onConflict: "key" }
      );
      if (error) {
        console.warn("Could not update app_config:", error.message);
        console.log("Run manually: UPDATE app_config SET value = '" + functionUrl + "' WHERE key = 'feed_webhook_url';");
      } else {
        console.log("\nUpdated app_config.feed_webhook_url in Supabase.");
      }
    } catch (e) {
      console.warn("Supabase update skipped:", e.message);
      console.log("Run manually: UPDATE app_config SET value = '" + functionUrl + "' WHERE key = 'feed_webhook_url';");
    }
  } else {
    console.log("\nSet SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to auto-update app_config.");
    console.log("Or run manually: UPDATE app_config SET value = '" + functionUrl + "' WHERE key = 'feed_webhook_url';");
  }

  console.log("\n--- Triggers (pg_net) ---");
  console.log("peer_requests, donations, organizations INSERT → Lambda → notifications/feed_items");
  console.log("Realtime pushes notifications to clients. No polling.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
