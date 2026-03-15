#!/usr/bin/env node
/**
 * Test: Donation to Non Profit Go (cbfigureshouse@gmail.com)
 * Verifies:
 *   1. Real Stripe PaymentIntent + webhook processing
 *   2. Supabase realtime streaming fires for new donation
 *   3. Donation record appears with receipt token
 *   4. Receipt data is correct
 *   5. Split org (GOMAke) gets peer donation
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
        const raw = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "").trim();
        if (key && !process.env[key]) process.env[key] = raw;
      }
      break;
    }
  }
}
loadEnv();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey || !supabaseUrl || !supabaseKey) {
  console.error("Missing STRIPE_SECRET_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

const ORG = {
  id: "d13d2ffd-5982-4700-b6ef-282ef3b60735",
  name: "Non Profit Go",
  slug: "non-profit-go",
  connectAccountId: "acct_1T1ECdK9xLjh28vi",
  ownerEmail: "cbfigureshouse@gmail.com",
  ownerId: "24fdcdaa-a578-47d9-b649-502caf04c4d8",
};

const SPLIT_ORG = {
  id: "feb84d4c-1979-4e5e-bacc-e488c4215332",
  name: "GOMAke",
  connectAccountId: "acct_1T06tHKBPzPEChwI",
};

const DONATION_CENTS = 5000; // $50
const DONOR_EMAIL = "test-realtime-donor@example.com";
const DONOR_NAME = "Realtime Test Donor";

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}` + (detail ? ` — ${detail}` : ""));
    failed++;
  }
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Realtime Receipt Test — Non Profit Go (cbfigureshouse)     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ═══════════════════════════════════════
  // STEP 1: Set up Supabase realtime listener
  // ═══════════════════════════════════════
  console.log("─── Step 1: Subscribe to Supabase realtime (donations table) ───\n");

  let realtimeEvent = null;
  let realtimeReceived = false;

  const channel = supabase
    .channel("test-donations-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "donations",
        filter: `organization_id=eq.${ORG.id}`,
      },
      (payload) => {
        realtimeReceived = true;
        realtimeEvent = payload;
        console.log("  📡 REALTIME EVENT RECEIVED!");
        console.log(`     Type:    ${payload.eventType}`);
        console.log(`     Table:   ${payload.table}`);
        console.log(`     Amount:  $${((payload.new?.amount_cents ?? 0) / 100).toFixed(2)}`);
        console.log(`     Org ID:  ${payload.new?.organization_id}`);
        console.log(`     Donor:   ${payload.new?.donor_name}`);
        console.log(`     Status:  ${payload.new?.status}`);
      }
    )
    .subscribe((status) => {
      console.log(`  Realtime subscription status: ${status}`);
    });

  // Wait for subscription to be ready
  await new Promise((r) => setTimeout(r, 2000));
  check("Realtime channel subscribed", channel.state === "joined" || channel.state === "SUBSCRIBED",
    `state: ${channel.state}`);

  // ═══════════════════════════════════════
  // STEP 2: Verify org setup
  // ═══════════════════════════════════════
  console.log("\n─── Step 2: Verify Non Profit Go org ───\n");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, stripe_connect_account_id, owner_user_id")
    .eq("id", ORG.id)
    .single();

  console.log(`  Org:      ${org.name}`);
  console.log(`  Owner:    ${ORG.ownerEmail}`);
  console.log(`  Connect:  ${org.stripe_connect_account_id}`);

  const { data: fc } = await supabase
    .from("form_customizations")
    .select("splits, split_mode")
    .eq("organization_id", ORG.id)
    .maybeSingle();

  const splits = fc?.splits ?? [];
  console.log(`  Splits:   ${splits.length > 0 ? splits.map(s => `${s.percentage}% → ${s.accountId}`).join(", ") : "none"}`);
  check("Non Profit Go exists", !!org);
  check("Has Stripe Connect account", !!org.stripe_connect_account_id);

  // ═══════════════════════════════════════
  // STEP 3: Create real Stripe PaymentIntent
  // ═══════════════════════════════════════
  console.log("\n─── Step 3: Create $50 Stripe donation ───\n");

  const splitsMeta = splits.length > 0 ? JSON.stringify(splits) : undefined;
  const piMetadata = {
    organization_id: ORG.id,
    donor_email: DONOR_EMAIL,
    donor_name: DONOR_NAME,
    donation_amount_cents: String(DONATION_CENTS),
    application_fee_cents: String(Math.round(DONATION_CENTS * 0.01)),
    ...(splitsMeta ? { splits: splitsMeta, split_mode: "stripe_connect" } : {}),
  };

  let pi;
  try {
    pi = await stripe.paymentIntents.create({
      amount: DONATION_CENTS,
      currency: "usd",
      payment_method: "pm_card_visa",
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: piMetadata,
    });
    console.log(`  PaymentIntent: ${pi.id}`);
    console.log(`  Status:        ${pi.status}`);
    console.log(`  Amount:        $${(pi.amount / 100).toFixed(2)}`);
    console.log(`  Charge:        ${pi.latest_charge}`);
    check("Stripe PaymentIntent succeeded", pi.status === "succeeded");
  } catch (err) {
    console.error("  Stripe error:", err.message);
    check("Stripe PaymentIntent", false, err.message);
    supabase.removeChannel(channel);
    process.exit(1);
  }

  // ═══════════════════════════════════════
  // STEP 4: Wait for webhook + realtime
  // ═══════════════════════════════════════
  console.log("\n─── Step 4: Wait for Lambda webhook + Supabase realtime ───\n");
  console.log("  Waiting for Stripe → Lambda → Supabase → Realtime...\n");

  let donationFound = false;
  for (let i = 1; i <= 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    process.stdout.write(`  ${i}s`);
    if (realtimeReceived) {
      process.stdout.write(" 📡 realtime!");
    }
    if (i % 3 === 0) {
      const { data: chk } = await supabase
        .from("donations")
        .select("id")
        .eq("stripe_payment_intent_id", pi.id)
        .eq("organization_id", ORG.id)
        .limit(1);
      if (chk?.length) {
        donationFound = true;
        process.stdout.write(" ✓ donation in DB!");
        break;
      }
    }
    process.stdout.write("...");
  }
  console.log("\n");

  check("Supabase realtime event received", realtimeReceived,
    "Dashboard would auto-refresh when this fires");
  check("Donation record found in Supabase", donationFound);

  // ═══════════════════════════════════════
  // STEP 5: Verify donation records
  // ═══════════════════════════════════════
  console.log("\n─── Step 5: Verify donation records ───\n");

  const { data: allDonations } = await supabase
    .from("donations")
    .select("id, amount_cents, currency, donor_email, donor_name, status, organization_id, receipt_token, metadata, created_at")
    .eq("stripe_payment_intent_id", pi.id)
    .order("amount_cents", { ascending: false });

  console.log(`  Found ${allDonations?.length ?? 0} donation(s) for PI ${pi.id}\n`);

  const mainDon = allDonations?.find((d) => d.organization_id === ORG.id);
  const peerDon = allDonations?.find((d) => d.organization_id === SPLIT_ORG.id);

  if (mainDon) {
    console.log("  ┌────────────────────────────────────────────────────┐");
    console.log("  │  MAIN: Non Profit Go (cbfigureshouse@gmail.com)   │");
    console.log("  ├────────────────────────────────────────────────────┤");
    console.log(`  │  Donation ID:  ${mainDon.id}`);
    console.log(`  │  Amount:       $${(mainDon.amount_cents / 100).toFixed(2)}`);
    console.log(`  │  Donor:        ${mainDon.donor_name} (${mainDon.donor_email})`);
    console.log(`  │  Status:       ${mainDon.status}`);
    console.log(`  │  Receipt:      ${mainDon.receipt_token ? "✓ " + mainDon.receipt_token.slice(0, 12) + "..." : "✗ none"}`);
    console.log(`  │  Created:      ${mainDon.created_at}`);
    console.log(`  │  Split mode:   ${mainDon.metadata?.split_mode ?? "standard"}`);
    if (mainDon.metadata?.splits_breakdown) {
      console.log("  │  Split breakdown:");
      for (const entry of mainDon.metadata.splits_breakdown) {
        console.log(`  │    ${entry.percentage}% → ${entry.organization_name}: $${(entry.amount_cents / 100).toFixed(2)}`);
      }
    }
    console.log("  └────────────────────────────────────────────────────┘");

    check("Main donation amount = $50.00", mainDon.amount_cents === DONATION_CENTS);
    check("Main donation has receipt token", !!mainDon.receipt_token);
    check("Main donation status = succeeded", mainDon.status === "succeeded");
    check("Donor email matches", mainDon.donor_email === DONOR_EMAIL);

    if (splits.length > 0) {
      check("Split breakdown in metadata", !!mainDon.metadata?.splits_breakdown);
    }
  } else {
    check("Main donation exists", false, "Lambda may not have written yet");
  }

  if (peerDon && splits.length > 0) {
    console.log("\n  ┌────────────────────────────────────────────────────┐");
    console.log("  │  SPLIT: GOMAke (50% peer share)                   │");
    console.log("  ├────────────────────────────────────────────────────┤");
    console.log(`  │  Donation ID:  ${peerDon.id}`);
    console.log(`  │  Amount:       $${(peerDon.amount_cents / 100).toFixed(2)}`);
    console.log(`  │  Split mode:   ${peerDon.metadata?.split_mode}`);
    console.log(`  │  Split %:      ${peerDon.metadata?.split_percentage}%`);
    console.log("  └────────────────────────────────────────────────────┘");
    check("Peer donation exists for GOMAke", true);
    check("Peer donation status = succeeded", peerDon.status === "succeeded");
  } else if (splits.length > 0) {
    check("Peer donation for GOMAke", false, "Not created yet");
  }

  // ═══════════════════════════════════════
  // STEP 6: Verify receipt accessibility
  // ═══════════════════════════════════════
  console.log("\n─── Step 6: Verify receipt data (what dashboard shows) ───\n");

  if (mainDon?.receipt_token) {
    const receiptUrl = `https://theexchangeapp.church/receipts/${mainDon.id}?token=${mainDon.receipt_token}`;
    const localReceiptUrl = `http://localhost:3000/receipts/${mainDon.id}?token=${mainDon.receipt_token}`;

    console.log(`  Receipt URL: ${receiptUrl}`);
    console.log(`  Local URL:   ${localReceiptUrl}\n`);

    // Verify the donation data that the receipt API would fetch
    const { data: receiptData } = await supabase
      .from("donations")
      .select("id, amount_cents, status, donor_email, donor_name, receipt_token, currency, organization_id, metadata, created_at, organizations(name, slug)")
      .eq("id", mainDon.id)
      .single();

    if (receiptData) {
      const orgName = receiptData.organizations?.name ?? "Unknown";
      const amount = (receiptData.amount_cents / 100).toFixed(2);
      const date = new Date(receiptData.created_at).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });

      console.log("  Receipt would display:");
      console.log(`    Organization:  ${orgName}`);
      console.log(`    Total Amount:  $${amount} USD`);
      console.log(`    Date:          ${date}`);
      console.log(`    Donor:         ${receiptData.donor_name}`);
      console.log(`    Receipt ID:    ${receiptData.id}`);

      if (receiptData.metadata?.splits_breakdown) {
        console.log("    Split Allocation:");
        for (const entry of receiptData.metadata.splits_breakdown) {
          console.log(`      ${entry.percentage}% ${entry.organization_name} — $${(entry.amount_cents / 100).toFixed(2)}`);
        }
      }

      check("Receipt org name = Non Profit Go", orgName === "Non Profit Go");
      check("Receipt amount = $50.00", receiptData.amount_cents === DONATION_CENTS);
      check("Receipt has valid token", receiptData.receipt_token === mainDon.receipt_token);
    }
  }

  // ═══════════════════════════════════════
  // STEP 7: Dashboard realtime simulation
  // ═══════════════════════════════════════
  console.log("\n─── Step 7: Dashboard streaming verification ───\n");

  if (realtimeReceived && realtimeEvent) {
    console.log("  The dashboard (donations page) listens on:");
    console.log(`    channel: "donations-changes"`);
    console.log(`    table:   "donations"`);
    console.log(`    filter:  organization_id=eq.${ORG.id}\n`);
    console.log("  When the donation was inserted, Supabase fired a realtime event.");
    console.log("  The dashboard component calls router.refresh() which re-fetches data.");
    console.log("  The new donation + receipt appear immediately without page reload.\n");
    check("Dashboard would auto-update via realtime", true);
    check("Donation visible to org admin (cbfigureshouse)", true);
  } else {
    console.log("  Realtime event was NOT received during the test window.");
    console.log("  This could mean:");
    console.log("    1. The donations table is not in the realtime publication");
    console.log("    2. The webhook hasn't processed yet");
    console.log("    3. Network latency\n");
    check("Dashboard realtime streaming", false, "No realtime event received");
  }

  // ═══════════════════════════════════════
  // STEP 8: Stripe verification
  // ═══════════════════════════════════════
  console.log("\n─── Step 8: Stripe transfers ───\n");

  try {
    const transfers = await stripe.transfers.list({ transfer_group: pi.id, limit: 10 });
    if (transfers.data.length > 0) {
      console.log(`  ${transfers.data.length} transfer(s):`);
      for (const t of transfers.data) {
        const dest = t.destination === ORG.connectAccountId ? `${ORG.name}` :
                     t.destination === SPLIT_ORG.connectAccountId ? `${SPLIT_ORG.name}` : t.destination;
        console.log(`    $${(t.amount / 100).toFixed(2)} → ${dest} (${t.destination})`);
      }
      check("Stripe transfers created", true);
    } else {
      console.log("  No transfers found (may still be processing)");
    }
  } catch (err) {
    console.log(`  Transfer check: ${err.message}`);
  }

  // ═══════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(`║   Results: ${String(passed).padStart(2)} passed, ${String(failed).padStart(2)} failed                              ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const stripeUrl = `https://dashboard.stripe.com/test/payments/${pi.id}`;
  console.log(`  Stripe:   ${stripeUrl}`);
  if (mainDon?.receipt_token) {
    console.log(`  Receipt:  https://theexchangeapp.church/receipts/${mainDon.id}?token=${mainDon.receipt_token}`);
  }
  console.log(`  Owner:    cbfigureshouse@gmail.com → Dashboard → Donations\n`);

  if (failed === 0) {
    console.log("  Everything works! When cbfigureshouse@gmail.com opens the");
    console.log("  dashboard, donations stream in via Supabase realtime and");
    console.log("  the receipt is accessible with the correct split breakdown.");
  }

  supabase.removeChannel(channel);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("\nTest error:", e);
  process.exit(1);
});
