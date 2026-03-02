#!/usr/bin/env node
/**
 * Apply the notifications realtime migration.
 *
 * Usage (with .env.local loaded):
 *   node --env-file=.env.local scripts/apply-notifications-realtime-migration.mjs
 *
 * Requires DATABASE_URL in env (from Supabase Dashboard > Project Settings > Database > Connection string).
 * Or use: supabase db push (after supabase link --project-ref atpkddkjvvtfosuuoprm)
 */

import pg from "pg";

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.DIRECT_URL;

if (!databaseUrl) {
  console.error("❌  Missing DATABASE_URL, SUPABASE_DB_URL, or DIRECT_URL");
  console.error("");
  console.error("Get it from: Supabase Dashboard → Project Settings → Database → Connection string (URI)");
  console.error("Then add to .env.local:  DATABASE_URL=\"postgresql://postgres.[ref]:[password]@...\"");
  console.error("");
  console.error("Or paste this SQL directly in Supabase Dashboard → SQL Editor:");
  console.error("  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;");
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query("ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;");
  console.log("✅  Migration applied: notifications added to supabase_realtime publication.");
  console.log("    Real-time notification badges will now update live without polling.");
} catch (err) {
  if (err.message?.includes("already") || err.message?.includes("duplicate") || err.code === "42710") {
    console.log("✅  notifications is already in supabase_realtime publication (nothing to do).");
  } else {
    console.error("❌  Migration failed:", err.message);
    process.exit(1);
  }
} finally {
  await client.end();
}
