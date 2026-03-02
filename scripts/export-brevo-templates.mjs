#!/usr/bin/env node
/**
 * Export email templates for Brevo — converts {{var}} to Brevo format and writes
 * to output directory. Use when sender has DMARC issues; upload HTML manually
 * in Brevo Campaigns or fix sender first.
 *
 * Usage: node scripts/export-brevo-templates.mjs [--out=./brevo-export]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAMPAIGN_DIR = resolve(__dirname, "..", "Email Campain", "email-campaigns");
const OUT_DIR = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1] || resolve(__dirname, "..", "brevo-export");

const VAR_MAP = {
  first_name: "contact.FNAME",
  dashboard_url: "params.DASHBOARD_URL",
  pricing_url: "params.PRICING_URL",
  signup_url: "params.SIGNUP_URL",
  give_page_url: "params.GIVE_PAGE_URL",
  billing_url: "params.BILLING_URL",
  support_url: "params.SUPPORT_URL",
  plan_name: "params.PLAN_NAME",
  plan_price: "params.PLAN_PRICE",
  trial_end_date: "params.TRIAL_END_DATE",
  trial_days_remaining: "params.TRIAL_DAYS_REMAINING",
  special_offer_url: "params.SPECIAL_OFFER_URL",
  unsubscribe_url: "unsubscribe",
  manage_preferences_url: "params.MANAGE_PREFERENCES_URL",
  company_address: "params.COMPANY_ADDRESS",
};

function convert(html) {
  let out = html;
  for (const [our, brevo] of Object.entries(VAR_MAP)) {
    const re = new RegExp(`\\{\\{${our}\\}\\}`, "gi");
    out = out.replace(re, brevo === "unsubscribe" ? "{{ unsubscribe }}" : `{{ ${brevo} }}`);
  }
  return out;
}

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  return lines.slice(1).map((l) => {
    const m = l.match(/^(\d+),"([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
    return m ? { week: m[1], track: m[2], subject: m[3], preheader: m[4], file: m[5] } : null;
  }).filter(Boolean);
}

const calendar = parseCSV(readFileSync(resolve(CAMPAIGN_DIR, "campaign-calendar.csv"), "utf-8"));
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];
for (const row of calendar) {
  const filePath = resolve(CAMPAIGN_DIR, row.file);
  if (!existsSync(filePath)) continue;
  const html = convert(readFileSync(filePath, "utf-8"));
  const outFile = `week-${row.week.padStart(2, "0")}-${row.track.replace(/\s+/g, "-").toLowerCase()}.html`;
  const outPath = resolve(OUT_DIR, outFile);
  writeFileSync(outPath, html, "utf-8");
  manifest.push({ week: row.week, track: row.track, subject: row.subject, preheader: row.preheader, file: outFile });
  console.log(`Exported: ${outFile}`);
}

writeFileSync(resolve(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
console.log(`\nExported ${manifest.length} templates to ${OUT_DIR}`);
console.log("manifest.json lists subject/preheader for each. Import HTML in Brevo → Campaigns → Create.");
