#!/usr/bin/env node
/**
 * Tail CloudWatch logs for the Stripe webhook Lambda.
 * Uses AWS SDK (no CLI required). Credentials from .env.local.
 *
 * Usage: node scripts/tail-lambda-logs.mjs [region]
 */

import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGION = process.env.AWS_REGION || process.argv[2] || "us-east-2";
const LOG_GROUP = "/aws/lambda/stripe-webhook-handler";

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
  if (process.env.AWSAccesskey) process.env.AWS_ACCESS_KEY_ID = process.env.AWSAccesskey;
  if (process.env.AWSSecretaccesskey) process.env.AWS_SECRET_ACCESS_KEY = process.env.AWSSecretaccesskey;
}

loadEnv();

const id = process.env.AWS_ACCESS_KEY_ID;
const secret = process.env.AWS_SECRET_ACCESS_KEY;
if (!id || !secret) {
  console.error("AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local");
  process.exit(1);
}

const client = new CloudWatchLogsClient({
  region: REGION,
  credentials: { accessKeyId: id, secretAccessKey: secret },
});

let lastSeen = Date.now() - 60_000; // start from 1 min ago

async function fetchLogs() {
  let nextToken = undefined;
  do {
    const res = await client.send(
      new FilterLogEventsCommand({
        logGroupName: LOG_GROUP,
        startTime: lastSeen,
        nextToken,
      })
    );

    for (const ev of res.events ?? []) {
      const ts = ev.timestamp ? new Date(ev.timestamp).toISOString() : "";
      console.log(ts, ev.message?.trim() ?? "");
      if (ev.timestamp) lastSeen = Math.max(lastSeen, ev.timestamp + 1);
    }

    nextToken = res.nextToken;
  } while (nextToken);
}

console.log(`Tailing logs for ${LOG_GROUP} in ${REGION}...`);
console.log("(Trigger a webhook or make a donation to see activity)\n");

async function poll() {
  try {
    await fetchLogs();
  } catch (err) {
    console.error("Error fetching logs:", err.message);
  }
  setTimeout(poll, 3000);
}

poll();
