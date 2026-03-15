#!/usr/bin/env node
/**
 * Setup The Exchange email campaigns in Brevo.
 *
 * This script:
 *  1. Creates 5 contact lists (Trial Signups, Free Plan, Paid Customers,
 *     Pastors Outreach, Investors / Partners)
 *  2. Creates email templates for all 5 workflows + founding-partner outreach
 *  3. Prints automation setup instructions for Brevo's workflow builder
 *
 * Usage:
 *   node --env-file=.env.local scripts/setup-exchange-campaigns.mjs [options]
 *
 * Options:
 *   --dry-run           Print what would be done without making API calls
 *   --api-key=<key>     Brevo API key (overrides BREVO_API_KEY env var)
 *   --sender-email=     Sender email (must be verified in Brevo)
 *   --sender-name=      Sender display name
 *   --only-lists        Only create contact lists
 *   --only-templates    Only create/update email templates
 *
 * Environment variables (in .env.local):
 *   BREVO_API_KEY       Your Brevo API key (xkeysib-...)
 *   BREVO_SENDER_EMAIL  Sender email (default: christopher@theexchangeapp.com)
 *   BREVO_SENDER_NAME   Sender name (default: Christopher Figures)
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, "exchange-campaigns", "templates");

// ─── Contact lists to create ────────────────────────────────────────────────

const CONTACT_LISTS = [
  {
    name: "Trial Signups",
    folderId: null, // will use default folder
  },
  {
    name: "Free Plan",
    folderId: null,
  },
  {
    name: "Paid Customers",
    folderId: null,
  },
  {
    name: "Pastors Outreach",
    folderId: null,
  },
  {
    name: "Investors / Partners",
    folderId: null,
  },
];

// ─── Email templates for each workflow ──────────────────────────────────────

const EMAIL_TEMPLATES = [
  // ── Workflow A: Trial Onboarding ─────────────────────────────────────────
  {
    id: "A1",
    workflow: "A",
    workflowName: "Trial Onboarding",
    day: 0,
    file: "a1-welcome.html",
    subject: "Welcome to The Exchange — let's get your first donation in 5 minutes",
    previewText: "You now have 14 days to explore the full platform.",
    senderOverride: null,
  },
  {
    id: "A2",
    workflow: "A",
    workflowName: "Trial Onboarding",
    day: 2,
    file: "a2-payment-splits.html",
    subject: "The feature that no other giving platform has (and why it matters)",
    previewText: "Automatic payment splits — built natively into The Exchange.",
    senderOverride: null,
  },
  {
    id: "A3",
    workflow: "A",
    workflowName: "Trial Onboarding",
    day: 4,
    file: "a3-website-builder.html",
    subject: "Your church website — in 30 minutes or less",
    previewText: "11 professional templates. Custom domain. Sermon CMS. All included.",
    senderOverride: null,
  },
  {
    id: "A4",
    workflow: "A",
    workflowName: "Trial Onboarding",
    day: 6,
    file: "a4-embed-form.html",
    subject: "Embed The Exchange on your existing website (no switching required)",
    previewText: "Paste one code snippet. Done in 3 minutes.",
    senderOverride: null,
  },
  {
    id: "A5",
    workflow: "A",
    workflowName: "Trial Onboarding",
    day: 8,
    file: "a5-pricing-comparison.html",
    subject: "Real talk: what The Exchange costs vs. what you're paying now",
    previewText: "On $10k/month, you save $2,000+ per year vs. Tithe.ly.",
    senderOverride: null,
  },
  {
    id: "A6",
    workflow: "A",
    workflowName: "Trial Onboarding",
    day: 10,
    file: "a6-trial-ending.html",
    subject: "4 days left on your trial — here's what happens when it ends",
    previewText: "Your website goes offline. Payment splits pause. Here's how to keep everything.",
    senderOverride: null,
  },
  {
    id: "A7",
    workflow: "A",
    workflowName: "Trial Onboarding",
    day: 13,
    file: "a7-trial-final-day.html",
    subject: "Your trial ends tomorrow — one last thing",
    previewText: "Upgrade today and I'll personally help you set up recurring giving.",
    senderOverride: null,
  },

  // ── Workflow B: Trial Urgency ─────────────────────────────────────────────
  {
    id: "B1",
    workflow: "B",
    workflowName: "Trial Urgency",
    day: 10,
    file: "b1-urgency-day10.html",
    subject: "Quick question about your trial",
    previewText: "What's been the most useful part so far?",
    senderOverride: null,
  },
  {
    id: "B2",
    workflow: "B",
    workflowName: "Trial Urgency",
    day: 12,
    file: "b2-urgency-day12.html",
    subject: "2 days left + a quick win",
    previewText: "Set up a QR code before your trial ends.",
    senderOverride: null,
  },
  {
    id: "B3",
    workflow: "B",
    workflowName: "Trial Urgency",
    day: 14,
    file: "b3-trial-over.html",
    subject: "Your trial is now over",
    previewText: "You're on Free. Donation forms are still active. Upgrade when you're ready.",
    senderOverride: null,
  },

  // ── Workflow C: Free Plan Upgrade ─────────────────────────────────────────
  {
    id: "C1",
    workflow: "C",
    workflowName: "Free Plan Upgrade",
    day: 60,
    file: "c1-free-plan-upgrade.html",
    subject: "You've processed {{params.TOTAL_DONATIONS}} in donations on The Exchange",
    previewText: "Here's what you're missing on the Free plan.",
    senderOverride: null,
  },

  // ── Workflow D: Win-Back ──────────────────────────────────────────────────
  {
    id: "D1",
    workflow: "D",
    workflowName: "Win-Back",
    day: 1,
    file: "d1-winback-day1.html",
    subject: "Your trial ended — you can still keep The Exchange for free",
    previewText: "Donation forms are still active. Upgrade whenever you're ready.",
    senderOverride: null,
  },
  {
    id: "D2",
    workflow: "D",
    workflowName: "Win-Back",
    day: 7,
    file: "d2-winback-day7.html",
    subject: "What other churches are doing with The Exchange",
    previewText: "$800/mo → $29/mo. $9,000 back in their ministry budget.",
    senderOverride: null,
  },
  {
    id: "D3",
    workflow: "D",
    workflowName: "Win-Back",
    day: 14,
    file: "d3-winback-day14.html",
    subject: "A feature you may not have seen yet — church banking",
    previewText: "FDIC-insured banking + debit cards, built into your dashboard.",
    senderOverride: null,
  },
  {
    id: "D4",
    workflow: "D",
    workflowName: "Win-Back",
    day: 30,
    file: "d4-winback-day30.html",
    subject: "Still here when you're ready",
    previewText: "Haven't heard from you in a month. No pressure — just checking in.",
    senderOverride: null,
  },

  // ── Workflow E: Milestone ─────────────────────────────────────────────────
  {
    id: "E1",
    workflow: "E",
    workflowName: "Milestone Congratulations",
    day: null,
    file: "e1-milestone-10k.html",
    subject: "🎉 {{params.CHURCH_NAME}} just hit $10,000 in giving on The Exchange",
    previewText: "Big news — and here's what unlocks at this giving level.",
    senderOverride: null,
  },

  // ── Cold Outreach ─────────────────────────────────────────────────────────
  {
    id: "OUT1",
    workflow: "Outreach",
    workflowName: "Founding Partner Outreach",
    day: null,
    file: "outreach-founding-partner.html",
    subject: "Free giving platform for {{params.CHURCH_NAME}} — 15-minute demo?",
    previewText: "Founding partner offer — no obligation, free forever.",
    senderOverride: "christopher@figuressolutions.com",
  },
];

// ─── Brevo API helper ────────────────────────────────────────────────────────

async function brevoRequest(apiKey, method, path, body = null) {
  const url = `https://api.brevo.com/v3${path}`;
  const opts = {
    method,
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1000 * attempt);
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      if (!res.ok) {
        const msg = data.message || data.code || data.error || res.statusText;
        throw new Error(`Brevo API error ${res.status}: ${msg}`);
      }
      return data;
    } catch (err) {
      lastError = err;
      if (err.message && !err.message.includes("fetch failed")) throw err;
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Load .env.local ─────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

// ─── Decode base64 Brevo MCP key ────────────────────────────────────────────

function resolveApiKey(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("xkeysib-")) return trimmed;
  try {
    const decoded = JSON.parse(Buffer.from(trimmed, "base64").toString("utf-8"));
    return decoded.api_key || decoded.apiKey || trimmed;
  } catch {
    return trimmed;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyLists = args.includes("--only-lists");
  const onlyTemplates = args.includes("--only-templates");

  const rawKey =
    args.find((a) => a.startsWith("--api-key="))?.slice("--api-key=".length) ||
    process.env.BREVO_API_KEY;

  const apiKey = resolveApiKey(rawKey);

  const senderEmail =
    args.find((a) => a.startsWith("--sender-email="))?.slice("--sender-email=".length) ||
    process.env.BREVO_SENDER_EMAIL ||
    "christopher@theexchangeapp.com";

  const senderName =
    args.find((a) => a.startsWith("--sender-name="))?.slice("--sender-name=".length) ||
    process.env.BREVO_SENDER_NAME ||
    "Christopher Figures";

  if (!apiKey && !dryRun) {
    console.error(
      "\n❌  No Brevo API key found.\n" +
        "    Set BREVO_API_KEY in .env.local or pass --api-key=xkeysib-...\n"
    );
    process.exit(1);
  }

  console.log("─────────────────────────────────────────────────────");
  console.log("  The Exchange — Brevo Campaign Setup");
  console.log("─────────────────────────────────────────────────────");
  if (dryRun) console.log("  [DRY RUN — no API calls will be made]\n");
  console.log(`  Sender: ${senderName} <${senderEmail}>`);
  console.log(`  Templates dir: ${TEMPLATES_DIR}\n`);

  const results = {
    lists: { created: [], skipped: [], errors: [] },
    templates: { created: [], updated: [], errors: [] },
  };

  // ── 1. Contact Lists ────────────────────────────────────────────────────

  if (!onlyTemplates) {
    console.log("📋  Creating contact lists...\n");

    let existingLists = [];
    if (!dryRun) {
      try {
        const data = await brevoRequest(apiKey, "GET", "/contacts/lists?limit=50&offset=0");
        existingLists = data.lists || [];
      } catch (e) {
        console.error("  ⚠️  Could not fetch existing lists:", e.message);
      }
    }

    for (const list of CONTACT_LISTS) {
      const existing = existingLists.find(
        (l) => l.name.toLowerCase() === list.name.toLowerCase()
      );

      if (existing) {
        console.log(`  ✓  "${list.name}" already exists (ID: ${existing.id})`);
        results.lists.skipped.push({ name: list.name, id: existing.id });
        continue;
      }

      if (dryRun) {
        console.log(`  [DRY RUN] Would create list: "${list.name}"`);
        results.lists.created.push({ name: list.name });
        continue;
      }

      try {
        const payload = { name: list.name };
        if (list.folderId) payload.folderId = list.folderId;
        const data = await brevoRequest(apiKey, "POST", "/contacts/lists", payload);
        console.log(`  ✅  Created list: "${list.name}" (ID: ${data.id})`);
        results.lists.created.push({ name: list.name, id: data.id });
      } catch (e) {
        console.error(`  ❌  Failed to create list "${list.name}": ${e.message}`);
        results.lists.errors.push({ name: list.name, error: e.message });
      }
    }
  }

  // ── 2. Email Templates ──────────────────────────────────────────────────

  if (!onlyLists) {
    console.log("\n📧  Creating email templates...\n");

    let existingTemplates = [];
    if (!dryRun) {
      try {
        const data = await brevoRequest(
          apiKey,
          "GET",
          "/smtp/templates?templateStatus=true&limit=50&offset=0"
        );
        existingTemplates = data.templates || [];
        // Also fetch inactive
        const data2 = await brevoRequest(
          apiKey,
          "GET",
          "/smtp/templates?templateStatus=false&limit=50&offset=0"
        );
        existingTemplates = [...existingTemplates, ...(data2.templates || [])];
      } catch (e) {
        console.error("  ⚠️  Could not fetch existing templates:", e.message);
      }
    }

    let currentWorkflow = null;

    for (const tmpl of EMAIL_TEMPLATES) {
      if (tmpl.workflow !== currentWorkflow) {
        currentWorkflow = tmpl.workflow;
        const wfNames = {
          A: "Workflow A — Trial Onboarding (7 emails, 14 days)",
          B: "Workflow B — Trial Urgency (3 emails)",
          C: "Workflow C — Free Plan Upgrade (monthly)",
          D: "Workflow D — Win-Back (4 emails, 30 days)",
          E: "Workflow E — Milestone Congratulations",
          Outreach: "Cold Outreach — Founding Partners",
        };
        console.log(`\n  ── ${wfNames[currentWorkflow] || currentWorkflow} ──`);
      }

      const templateName = `[Exchange] ${tmpl.id} — ${tmpl.subject.slice(0, 60)}`;
      const filePath = resolve(TEMPLATES_DIR, tmpl.file);

      if (!existsSync(filePath)) {
        console.error(`  ❌  Template file not found: ${tmpl.file}`);
        results.templates.errors.push({ id: tmpl.id, error: "File not found" });
        continue;
      }

      const htmlContent = readFileSync(filePath, "utf-8");
      const effectiveSender = tmpl.senderOverride || senderEmail;

      if (dryRun) {
        const dayLabel = tmpl.day !== null ? `Day ${tmpl.day}` : "Triggered";
        console.log(`  [DRY RUN] ${tmpl.id} (${dayLabel}): "${tmpl.subject}"`);
        results.templates.created.push({ id: tmpl.id, name: templateName });
        continue;
      }

      // Check if already exists
      const existing = existingTemplates.find((t) => t.name === templateName);

      try {
        const payload = {
          sender: { name: senderName, email: effectiveSender },
          templateName,
          subject: tmpl.subject,
          htmlContent,
          previewText: tmpl.previewText,
          isActive: true,
        };

        let resultId;
        if (existing) {
          await brevoRequest(apiKey, "PUT", `/smtp/templates/${existing.id}`, payload);
          resultId = existing.id;
          console.log(`  🔄  Updated template ${tmpl.id} (ID: ${resultId})`);
          results.templates.updated.push({ id: tmpl.id, brevoId: resultId, name: templateName });
        } else {
          const data = await brevoRequest(apiKey, "POST", "/smtp/templates", payload);
          resultId = data.id;
          console.log(`  ✅  Created template ${tmpl.id} (Brevo ID: ${resultId})`);
          results.templates.created.push({ id: tmpl.id, brevoId: resultId, name: templateName });
        }
      } catch (e) {
        console.error(`  ❌  Failed template ${tmpl.id}: ${e.message}`);
        results.templates.errors.push({ id: tmpl.id, error: e.message });
      }

      // Small delay to avoid rate limits
      await sleep(200);
    }
  }

  // ── 3. Summary & Automation Instructions ────────────────────────────────

  console.log("\n─────────────────────────────────────────────────────");
  console.log("  Summary");
  console.log("─────────────────────────────────────────────────────");

  if (!onlyTemplates) {
    const totalLists =
      results.lists.created.length + results.lists.skipped.length;
    console.log(`  Contact lists:   ${totalLists} ready (${results.lists.created.length} new)`);
    if (results.lists.errors.length)
      console.log(`                   ${results.lists.errors.length} errors`);
  }

  if (!onlyLists) {
    const totalTemplates =
      results.templates.created.length + results.templates.updated.length;
    console.log(`  Email templates: ${totalTemplates} ready (${results.templates.created.length} new, ${results.templates.updated.length} updated)`);
    if (results.templates.errors.length)
      console.log(`                   ${results.templates.errors.length} errors`);
  }

  printAutomationInstructions();
}

// ─── Automation Setup Instructions ───────────────────────────────────────────

function printAutomationInstructions() {
  console.log(`
─────────────────────────────────────────────────────
  Next Steps — Build Automations in Brevo
─────────────────────────────────────────────────────

Your templates are now in Brevo. To build the 5 automation
workflows, go to:

  Brevo → Automations → Create a workflow

─── WORKFLOW A — Trial Onboarding ───────────────────
  Trigger:  Contact added to "Trial Signups" list
  Emails:
    A1  →  Send immediately
    A2  →  Wait 2 days
    A3  →  Wait 2 days
    A4  →  Wait 2 days
    A5  →  Wait 2 days
    A6  →  Wait 2 days
    A7  →  Wait 3 days

─── WORKFLOW B — Trial Urgency ──────────────────────
  Trigger:  Contact added to "Trial Signups" list
            + Wait 10 days (runs in parallel with A)
  Emails:
    B1  →  Send at Day 10
    B2  →  Wait 2 days
    B3  →  Wait 2 days

─── WORKFLOW C — Free Plan Upgrade ──────────────────
  Trigger:  Contact added to "Free Plan" list
            + Wait 60 days
  Emails:
    C1  →  Send once per month (recurring)

─── WORKFLOW D — Win-Back ───────────────────────────
  Trigger:  Trial expires without upgrade
            (remove from Trial Signups, not added to Paid)
  Emails:
    D1  →  Wait 1 day after trial ends
    D2  →  Wait 7 days
    D3  →  Wait 7 days
    D4  →  Wait 16 days

─── WORKFLOW E — Milestone ──────────────────────────
  Trigger:  Custom event: "donation_milestone_10k"
            (fired from your app when total donations >= $10,000)
  Emails:
    E1  →  Send immediately on trigger

─── COLD OUTREACH ───────────────────────────────────
  Template: OUT1 — Founding Partner Outreach
  Send manually to "Pastors Outreach" list
  Personalize CHURCH_NAME before sending each batch.

─────────────────────────────────────────────────────
  URL parameters to configure in each template:
─────────────────────────────────────────────────────
  {{ params.DASHBOARD_URL }}    → https://theexchangeapp.com/dashboard
  {{ params.BILLING_URL }}      → https://theexchangeapp.com/billing
  {{ params.SIGNUP_URL }}       → https://theexchangeapp.com/signup
  {{ params.CALENDLY_URL }}     → your Calendly link
  {{ params.CHURCH_NAME }}      → set per contact attribute
  {{ params.TOTAL_DONATIONS }}  → set via API/webhook
  {{ params.DONOR_COUNT }}      → set via API/webhook
  {{ params.SAVINGS_VS_TITHELY }} → set via API/webhook
  {{ contact.FNAME }}           → pulled from contact's FIRSTNAME attribute

─────────────────────────────────────────────────────
`);
}

main().catch((e) => {
  console.error("\n❌  Fatal error:", e.message);
  process.exit(1);
});
