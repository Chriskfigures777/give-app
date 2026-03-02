#!/usr/bin/env node
/**
 * Load Give App email campaigns into Resend.
 *
 * 1. Reads campaign-calendar.csv for timing, subjects, preheaders
 * 2. Loads HTML templates from Email Campain/email-campaigns/
 * 3. Converts {{var}} to Resend format {{{VAR|default}}}
 * 4. Creates Resend templates and/or draft broadcasts
 *
 * Prerequisites:
 *   - RESEND_API_KEY in .env.local
 *   - RESEND_FROM_EMAIL (e.g. "Give <noreply@yourdomain.com>")
 *   - For broadcasts: RESEND_SEGMENT_ID or track-specific segment IDs
 *
 * Usage:
 *   node scripts/load-resend-campaigns.mjs [--templates-only] [--dry-run] [--segment-id=xxx]
 *
 * Options:
 *   --templates-only  Create Resend templates only (no broadcasts)
 *   --broadcasts      Create draft broadcasts (requires segment ID)
 *   --dry-run         Print what would be done without API calls
 *   --segment-id=xxx  Use this segment for all broadcasts (or set per-track via env)
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const projectRoot = resolve(__dirname, "..");

const CAMPAIGN_DIR = resolve(projectRoot, "Email Campain", "email-campaigns");
const CONFIG_PATH = resolve(CAMPAIGN_DIR, "resend-campaign-config.json");

// Resend variable mapping: {{our_var}} -> {{{RESEND_VAR|default}}}
const VAR_MAP = {
  first_name: "FIRST_NAME",
  dashboard_url: "DASHBOARD_URL",
  pricing_url: "PRICING_URL",
  signup_url: "SIGNUP_URL",
  give_page_url: "GIVE_PAGE_URL",
  billing_url: "BILLING_URL",
  support_url: "SUPPORT_URL",
  plan_name: "PLAN_NAME",
  plan_price: "PLAN_PRICE",
  trial_end_date: "TRIAL_END_DATE",
  trial_days_remaining: "TRIAL_DAYS_REMAINING",
  special_offer_url: "SPECIAL_OFFER_URL",
  unsubscribe_url: "RESEND_UNSUBSCRIBE_URL",
  manage_preferences_url: "MANAGE_PREFERENCES_URL",
  company_address: "COMPANY_ADDRESS",
};

function loadEnv() {
  for (const base of [projectRoot, process.cwd()]) {
    const envPath = resolve(base, ".env.local");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = val;
        }
      }
      break;
    }
  }
}

function convertToResendVars(html) {
  let out = html;
  for (const [our, resend] of Object.entries(VAR_MAP)) {
    const re = new RegExp(`\\{\\{${our}\\}\\}`, "gi");
    const defaultVal = our === "first_name" ? "there" : our.includes("url") ? "#" : "";
    out = out.replace(re, `{{{${resend}|${defaultVal}}}}`);
  }
  return out;
}

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = {};
    const vals = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    headers.forEach((h, j) => {
      row[h] = (vals[j] || "").trim().replace(/^"|"$/g, "");
    });
    rows.push(row);
  }
  return rows;
}

function getTrackFromFile(file) {
  if (file.startsWith("welcome/")) return "welcome";
  if (file.startsWith("conversion/")) return "conversion";
  if (file.startsWith("trial/")) return "trial";
  if (file.startsWith("reengagement/")) return "reengagement";
  if (file.startsWith("marketing/")) return "marketing";
  return "unknown";
}

async function main() {
  loadEnv();

  const args = process.argv.slice(2);
  const createBroadcasts = args.includes("--broadcasts");
  const templatesOnly = args.includes("--templates-only") || !createBroadcasts;
  const dryRun = args.includes("--dry-run");
  const segmentIdArg = args.find((a) => a.startsWith("--segment-id="));
  const segmentId = segmentIdArg
    ? segmentIdArg.split("=")[1]
    : process.env.RESEND_SEGMENT_ID;

  const apiKey = process.env.RESEND_API_KEY?.trim() || process.env.Resend_API_Key?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "Give <onboarding@resend.dev>";

  if (!apiKey && !dryRun) {
    console.error("Error: RESEND_API_KEY not set. Add to .env.local");
    process.exit(1);
  }

  if (!existsSync(CAMPAIGN_DIR)) {
    console.error("Error: Campaign directory not found:", CAMPAIGN_DIR);
    process.exit(1);
  }

  const calendarPath = resolve(CAMPAIGN_DIR, "campaign-calendar.csv");
  if (!existsSync(calendarPath)) {
    console.error("Error: campaign-calendar.csv not found");
    process.exit(1);
  }

  const calendar = parseCSV(readFileSync(calendarPath, "utf-8"));
  console.log(`Loaded ${calendar.length} campaigns from campaign-calendar.csv\n`);

  let Resend;
  let resend;
  if (!dryRun && apiKey) {
    Resend = (await import("resend")).Resend;
    resend = new Resend(apiKey);
  }

  const results = { templates: [], broadcasts: [], errors: [] };

  for (const row of calendar) {
    const { Week, Track, Subject, Preheader, File } = row;
    const filePath = resolve(CAMPAIGN_DIR, File);
    if (!existsSync(filePath)) {
      results.errors.push({ week: Week, file: File, error: "File not found" });
      continue;
    }

    let html = readFileSync(filePath, "utf-8");
    html = convertToResendVars(html);

    const name = `Give Week ${Week} - ${Track} - ${Subject.slice(0, 40)}`;
    const trackName = getTrackFromFile(File);

    if (!createBroadcasts) {
      if (dryRun) {
        console.log(`[DRY RUN] Would create template: ${name}`);
        results.templates.push({ week: Week, name, file: File });
      } else if (resend?.templates) {
        try {
          const resp = await resend.templates.create({
            name: `give-week-${Week}-${trackName}`,
            html,
          });
          const { data, error } = await Promise.resolve(resp);
          if (error) {
            results.errors.push({ week: Week, file: File, error: error.message });
          } else {
            results.templates.push({ week: Week, id: data?.id, name });
            console.log(`Created template: ${name} (${data?.id})`);
          }
        } catch (e) {
          results.errors.push({ week: Week, file: File, error: e.message });
        }
      }
    }

    if (createBroadcasts && segmentId && !templatesOnly) {
      if (dryRun) {
        console.log(`[DRY RUN] Would create broadcast: ${name} -> segment ${segmentId}`);
        results.broadcasts.push({ week: Week, name, subject: Subject });
      } else if (resend?.broadcasts) {
        try {
          const { data, error } = await resend.broadcasts.create({
            name,
            from: fromEmail,
            subject: Subject,
            previewText: Preheader,
            html,
            segmentId,
            send: false,
          });
          if (error) {
            results.errors.push({ week: Week, file: File, error: error.message });
          } else {
            results.broadcasts.push({ week: Week, id: data?.id, name });
            console.log(`Created draft broadcast: ${name} (${data?.id})`);
          }
        } catch (e) {
          results.errors.push({ week: Week, file: File, error: e.message });
        }
      }
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Templates: ${results.templates.length}`);
  console.log(`Broadcasts: ${results.broadcasts.length}`);
  if (results.errors.length) {
    console.log(`Errors: ${results.errors.length}`);
    results.errors.forEach((e) => console.error("  ", e.week, e.file, e.error));
  }

  if (createBroadcasts && !segmentId && !templatesOnly && !dryRun) {
    console.log("\n⚠️  To create broadcasts, set RESEND_SEGMENT_ID or pass --segment-id=xxx");
    console.log("   Create segments in Resend Dashboard: Audiences → Segments");
    console.log("   Tracks: welcome, conversion, trial, reengagement, marketing");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
