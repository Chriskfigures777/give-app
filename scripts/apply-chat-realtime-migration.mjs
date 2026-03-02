#!/usr/bin/env node
/**
 * Apply the chat_messages realtime migration.
 *
 * Usage (with .env.local loaded):
 *   node --env-file=.env.local scripts/apply-chat-realtime-migration.mjs
 *
 * Requires DATABASE_URL in env (from Supabase Dashboard > Project Settings > Database > Connection string).
 * Or use: supabase db push (after supabase link)
 */

import pg from "pg";

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.DIRECT_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL, SUPABASE_DB_URL, or DIRECT_URL");
  console.error("Get it from: Supabase Dashboard > Project Settings > Database > Connection string");
  console.error("");
  console.error("Or run: supabase db push (after supabase link --project-ref YOUR_REF)");
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query("alter publication supabase_realtime add table chat_messages;");
  console.log("Migration applied: chat_messages added to supabase_realtime publication.");
} catch (err) {
  if (err.message?.includes("already") || err.message?.includes("duplicate")) {
    console.log("chat_messages is already in supabase_realtime publication.");
  } else {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
} finally {
  await client.end();
}
