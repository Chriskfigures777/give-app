#!/usr/bin/env node
/**
 * Load Give App email campaigns into Brevo (formerly Sendinblue).
 *
 * 1. Reads campaign-calendar.csv for timing, subjects, preheaders
 * 2. Loads HTML templates from Email Campain/email-campaigns/
 * 3. Converts {{var}} to Brevo format {{ contact.VAR }} or {{ params.VAR }}
 * 4. Creates Brevo email campaigns (drafts)
 *
 * Prerequisites:
 *   - BREVO_API_KEY in .env.local (or pass --api-key=xxx)
 *   - Sender configured in Brevo (uses first sender by default)
 *   - Contact list for recipients (optional for draft)
 *
 * Usage:
 *   node scripts/load-brevo-campaigns.mjs [--dry-run] [--api-key=xxx] [--list-id=2] [--test]
 *
 * Options:
 *   --dry-run       Print what would be done without API calls
 *   --api-key=      Brevo API key (or BREVO_API_KEY env). Base64-encoded OK.
 *   --list-id=      Contact list ID for recipients (required to send)
 *   --sender-email= Override sender email (must be verified in Brevo)
 *   --test          Create only Week 1 campaign as test
 *
 * Note: Sender must pass DMARC. Add verified senders in Brevo → Senders & IP.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const CAMPAIGN_DIR = resolve(projectRoot, "Email Campain", "email-campaigns");

// Brevo uses {{ contact.FNAME }} for contact attributes
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
  unsubscribe_url: "unsubscribe", // Brevo handles this
  manage_preferences_url: "params.MANAGE_PREFERENCES_URL",
  company_address: "params.COMPANY_ADDRESS",
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

function convertToBrevoVars(html) {
  let out = html;
  for (const [our, brevo] of Object.entries(VAR_MAP)) {
    const re = new RegExp(`\\{\\{${our}\\}\\}`, "gi");
    if (brevo === "unsubscribe") {
      out = out.replace(re, "{{ unsubscribe }}");
    } else {
      out = out.replace(re, `{{ ${brevo} }}`);
    }
  }
  return out;
}

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const m = lines[i].match(/^(\d+),"([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
    if (m) rows.push({ Week: m[1], Track: m[2], Subject: m[3], Preheader: m[4], File: m[5] });
  }
  return rows;
}

async function brevoRequest(apiKey, method, path, body = null) {
  const url = `https://api.brevo.com/v3${path}`;
  const opts = {
    method,
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.code || res.statusText);
  return data;
}

async function main() {
  loadEnv();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const testOnly = args.includes("--test");
  const apiKeyArg = args.find((a) => a.startsWith("--api-key="));
  const listIdArg = args.find((a) => a.startsWith("--list-id="));
  const senderEmailArg = args.find((a) => a.startsWith("--sender-email="));
  const defaultSender = process.env.BREVO_SENDER_EMAIL || "noreply@em.figuressolutions.com";

  let apiKey =
    apiKeyArg?.split("=")[1] ||
    process.env.BREVO_API_KEY?.trim() ||
    process.env.BREVO_API_KEY_BASE64;

  // Support base64-encoded key (MCP format)
  if (apiKey && apiKey.length > 60 && !apiKey.startsWith("xkeysib-")) {
    try {
      const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString());
      apiKey = decoded.api_key || apiKey;
    } catch {}
  }

  if (!apiKey && !dryRun) {
    console.error("Error: BREVO_API_KEY not set. Add to .env.local or pass --api-key=xxx");
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

  let calendar = parseCSV(readFileSync(calendarPath, "utf-8"));
  if (testOnly) calendar = calendar.slice(0, 1);

  console.log(`Loaded ${calendar.length} campaign(s) from campaign-calendar.csv\n`);

  let sender = null;
  if (!dryRun && apiKey) {
    try {
      const { senders } = await brevoRequest(apiKey, "GET", "/senders");
      sender = senders?.[0] || { id: 1, name: "Give", email: defaultSender };
      if (senderEmailArg) {
        const email = senderEmailArg.split("=")[1];
        sender = { ...sender, email, name: sender.name };
      } else {
        const emSender = senders?.find((s) => s.email === defaultSender);
        if (emSender) sender = emSender;
        else sender = { ...sender, email: defaultSender, name: "Give App" };
      }
      console.log(`Using sender: ${sender.name} <${sender.email}>\n`);
    } catch (e) {
      console.error("Failed to get sender:", e.message);
      process.exit(1);
    }
  }

  const results = { created: [], errors: [] };

  for (const row of calendar) {
    const { Week, Track, Subject, Preheader, File } = row;
    const filePath = resolve(CAMPAIGN_DIR, File);
    if (!existsSync(filePath)) {
      results.errors.push({ week: Week, file: File, error: "File not found" });
      continue;
    }

    let html = readFileSync(filePath, "utf-8");
    html = convertToBrevoVars(html);

    const name = `Give Week ${Week} - ${Track} - ${Subject.slice(0, 50)}`;

    if (dryRun) {
      console.log(`[DRY RUN] Would create campaign: ${name}`);
      results.created.push({ week: Week, name });
      continue;
    }

    try {
      const payload = {
        name,
        subject: Subject,
        sender: senderEmailArg ? { name: sender.name, email: sender.email } : { id: sender.id },
        htmlContent: html,
        previewText: Preheader,
      };

      if (listIdArg) {
        const listId = parseInt(listIdArg.split("=")[1], 10);
        payload.recipients = { listIds: [listId] };
      }

      const data = await brevoRequest(apiKey, "POST", "/emailCampaigns", payload);
      results.created.push({ week: Week, id: data.id, name });
      console.log(`Created campaign: ${name} (ID: ${data.id})`);
    } catch (e) {
      results.errors.push({ week: Week, file: File, error: e.message });
      console.error(`Failed Week ${Week}:`, e.message);
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Created: ${results.created.length}`);
  if (results.errors.length) {
    console.log(`Errors: ${results.errors.length}`);
    results.errors.forEach((e) => console.error("  ", e.week, e.file, e.error));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
