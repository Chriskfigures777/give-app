#!/usr/bin/env node
/**
 * Test Supabase Auth connectivity. Run: node scripts/test-supabase.mjs
 * Reads from .env.local
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
let env = {};
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].replace(/^["']|["']$/g, "").trim();
  }
} catch (e) {
  console.error("Error: .env.local not found");
  process.exit(1);
}

const BASE_URL = (env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "").trim();
const KEY = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "").trim();

if (!BASE_URL || !KEY) {
  console.error("Error: Need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

console.log("Testing Supabase at:", BASE_URL);
console.log("");

/** Fetch with timeout and retries for flaky networks. */
async function fetchWithRetry(url, opts = {}, timeout = 10000, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        ...opts,
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
          ...opts.headers,
        },
        signal: ctrl.signal,
      });
      clearTimeout(id);
      return res;
    } catch (e) {
      clearTimeout(id);
      if (attempt < maxRetries) {
        console.log(`   Retry ${attempt}/${maxRetries} in 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        throw e;
      }
    }
  }
}

try {
  // 1. Health
  console.log("1. Health check...");
  const health = await fetchWithRetry(`${BASE_URL}/auth/v1/health`);
  if (health.ok || health.status === 401) {
    console.log("   OK (HTTP", health.status, ") - Supabase reachable");
  } else {
    throw new Error(`Health failed: HTTP ${health.status}`);
  }

  // 2. Sign up
  console.log("\n2. Sign up test...");
  const signup = await fetchWithRetry(`${BASE_URL}/auth/v1/signup`, {
    method: "POST",
    body: JSON.stringify({
      email: `test-${Date.now()}@example.com`,
      password: "testpass123",
    }),
  });
  const body = await signup.json();
  if (signup.ok || signup.status === 422) {
    console.log("   OK (HTTP", signup.status, ") - Auth API responding");
    if (body.error) console.log("   Note:", body.error_description || body.msg || "");
  } else {
    throw new Error(`Signup failed: HTTP ${signup.status} - ${JSON.stringify(body)}`);
  }

  console.log("\nAll checks passed. Supabase is reachable with your anon key.");
} catch (e) {
  if (e.name === "AbortError") {
    console.error("   FAIL: Request timed out (Supabase unreachable or slow)");
    console.error("   Tip: Try 'bash scripts/test-supabase.sh' if curl works in your environment.");
  } else {
    console.error("   FAIL:", e.message);
  }
  process.exit(1);
}
