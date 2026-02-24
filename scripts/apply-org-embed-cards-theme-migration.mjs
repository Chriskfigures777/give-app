#!/usr/bin/env node
/**
 * Add background_color, text_color, embed_form_theme to org_embed_cards.
 *
 * Usage (with .env.local loaded):
 *   node --env-file=.env.local scripts/apply-org-embed-cards-theme-migration.mjs
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

const sql = `
ALTER TABLE public.org_embed_cards
  ADD COLUMN IF NOT EXISTS background_color text,
  ADD COLUMN IF NOT EXISTS text_color text,
  ADD COLUMN IF NOT EXISTS embed_form_theme text DEFAULT 'default';
`;

try {
  await client.connect();
  await client.query(sql);
  console.log("Migration applied: background_color, text_color, embed_form_theme added to org_embed_cards.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
