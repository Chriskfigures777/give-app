#!/usr/bin/env node
/**
 * Seed mock organizations, connections, and feed items for testing the newsfeed.
 *
 * Uses Supabase (service role) to create:
 * - Mock organizations
 * - donor_saved_organizations (so you see them as a donor)
 * - peer_connections (so your org sees them as connected peers)
 * - feed_items (donations, new_org, goal_progress, connection_request)
 *
 * Usage:
 *   node scripts/seed-mock-organizations.mjs
 *   node scripts/seed-mock-organizations.mjs --user-id=YOUR_USER_UUID
 *   node scripts/seed-mock-organizations.mjs --org-id=YOUR_ORG_UUID
 *
 * Env: .env.local must have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env.local");
let env = {};
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].replace(/^["']|["']$/g, "").trim();
  }
} catch {
  console.error("Error: .env.local not found. Create it from .env.example");
  process.exit(1);
}

const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
if (!url || !serviceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const userId = args.find((a) => a.startsWith("--user-id="))?.split("=")[1]?.trim();
const orgId = args.find((a) => a.startsWith("--org-id="))?.split("=")[1]?.trim();

const supabase = createClient(url, serviceKey);

const MOCK_ORGS = [
  {
    name: "Sunrise Community Kitchen",
    slug: "sunrise-community-kitchen-mock",
    description: "Feeding families in need since 2015. Hot meals, pantry boxes, and nutrition education.",
    city: "Austin",
    state: "TX",
    causes: ["hunger", "community"],
    page_summary: "We serve 500+ meals weekly to families facing food insecurity.",
  },
  {
    name: "Green Valley Animal Rescue",
    slug: "green-valley-animal-rescue-mock",
    description: "Rescuing and rehoming abandoned animals. No-kill shelter with adoption programs.",
    city: "Portland",
    state: "OR",
    causes: ["animals", "welfare"],
    page_summary: "Over 2,000 animals adopted in the last year.",
  },
  {
    name: "Youth STEM Academy",
    slug: "youth-stem-academy-mock",
    description: "Free after-school STEM programs for underserved youth. Robotics, coding, and science.",
    city: "Denver",
    state: "CO",
    causes: ["education", "youth"],
    page_summary: "Empowering the next generation of innovators.",
  },
  {
    name: "Clean Water Initiative",
    slug: "clean-water-initiative-mock",
    description: "Building wells and water systems in communities without access to clean water.",
    city: "Seattle",
    state: "WA",
    causes: ["environment", "health"],
    page_summary: "Clean water for everyone, everywhere.",
  },
  {
    name: "Harmony Arts Collective",
    slug: "harmony-arts-collective-mock",
    description: "Free music and art programs for at-risk youth. Instruments, lessons, and performance opportunities.",
    city: "Nashville",
    state: "TN",
    causes: ["arts", "youth"],
    page_summary: "Art transforms lives.",
  },
];

async function main() {
  console.log("Seeding mock organizations and feed items...\n");

  const createdOrgIds = [];

  for (const org of MOCK_ORGS) {
    const { data: existing } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", org.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  Org already exists: ${org.name} (${org.slug})`);
      createdOrgIds.push(existing.id);
      continue;
    }

    const { data: inserted, error } = await supabase
      .from("organizations")
      .insert({
        name: org.name,
        slug: org.slug,
        description: org.description,
        city: org.city,
        state: org.state,
        causes: org.causes,
        page_summary: org.page_summary,
        onboarding_completed: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to create ${org.name}:`, error.message);
      continue;
    }
    console.log(`  Created org: ${org.name} (${inserted.id})`);
    createdOrgIds.push(inserted.id);
  }

  if (createdOrgIds.length === 0) {
    console.log("\nNo organizations to link. Exiting.");
    return;
  }

  // Link to user (donor_saved_organizations) so feed shows these orgs
  if (userId) {
    let linked = 0;
    for (const oid of createdOrgIds) {
      const { error } = await supabase
        .from("donor_saved_organizations")
        .upsert({ user_id: userId, organization_id: oid }, { onConflict: "user_id,organization_id" });
      if (!error) linked++;
    }
    console.log(`\n  Linked ${linked} orgs to user (saved)`);
  }

  // Link to org (peer_connections) so feed shows these orgs for org admins
  if (orgId) {
    for (const oid of createdOrgIds) {
      if (oid === orgId) continue;
      const { error } = await supabase.from("peer_connections").insert({
        side_a_id: orgId,
        side_a_type: "organization",
        side_b_id: oid,
        side_b_type: "organization",
      });
      if (error) {
        // May already exist
        const { error: reverse } = await supabase.from("peer_connections").insert({
          side_a_id: oid,
          side_a_type: "organization",
          side_b_id: orgId,
          side_b_type: "organization",
        });
        if (reverse) console.error("  Connection error:", reverse.message);
      }
    }
    console.log(`  Linked org ${orgId} to ${createdOrgIds.length} mock orgs (peers)`);
  }

  // Create feed_items for variety (map org id -> name/slug)
  const orgMeta = {};
  for (let i = 0; i < MOCK_ORGS.length && i < createdOrgIds.length; i++) {
    orgMeta[createdOrgIds[i]] = { name: MOCK_ORGS[i].name, slug: MOCK_ORGS[i].slug };
  }

  const feedTypes = ["donation", "new_org", "goal_progress", "connection_request"];
  let feedCount = 0;

  for (let i = 0; i < createdOrgIds.length; i++) {
    const oid = createdOrgIds[i];
    const meta = orgMeta[oid] || { name: "Organization", slug: "org" };

    // new_org
    const { error: e1 } = await supabase.from("feed_items").insert({
      item_type: "new_org",
      organization_id: oid,
      payload: {
        organization_name: meta.name,
        organization_slug: meta.slug,
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
      },
    });
    if (!e1) feedCount++;

    // donation
    const { error: e2 } = await supabase.from("feed_items").insert({
      item_type: "donation",
      organization_id: oid,
      payload: {
        amount_cents: [2500, 5000, 10000, 1500, 7500][i % 5],
        organization_name: meta.name,
        organization_slug: meta.slug,
        created_at: new Date(Date.now() - (i + 1) * 7200000).toISOString(),
      },
    });
    if (!e2) feedCount++;

    // goal_progress
    const { error: e3 } = await supabase.from("feed_items").insert({
      item_type: "goal_progress",
      organization_id: oid,
      payload: {
        campaign_name: "Annual Fund",
        current_amount_cents: [15000, 45000, 80000][i % 3],
        goal_amount_cents: 100000,
        organization_name: meta.name,
        organization_slug: meta.slug,
        created_at: new Date(Date.now() - (i + 2) * 3600000).toISOString(),
      },
    });
    if (!e3) feedCount++;
  }

  console.log(`\n  Created ${feedCount} feed items.`);
  console.log("\nDone. Visit /feed to see the newsfeed.");
  if (!userId && !orgId) {
    console.log("\nTip: Pass --user-id=YOUR_USER_UUID to link orgs to your account (saved orgs).");
    console.log("     Or --org-id=YOUR_ORG_UUID to link as peer connections.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
