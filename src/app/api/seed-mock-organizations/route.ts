import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

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

/**
 * POST: Seed mock organizations, link to current user (saved + peer connections), and create feed items.
 * Use this to populate the newsfeed for testing. Requires auth.
 */
export async function POST() {
  try {
    const { user, profile } = await requireAuth();
    const supabase = createServiceClient();

    const createdOrgIds: string[] = [];

    for (const org of MOCK_ORGS) {
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", org.slug)
        .maybeSingle();

      if (existing) {
        createdOrgIds.push((existing as { id: string }).id);
        continue;
      }

      const insertPayload: Database["public"]["Tables"]["organizations"]["Insert"] = {
        name: org.name,
        slug: org.slug,
        description: org.description,
        city: org.city,
        state: org.state,
        causes: org.causes,
        page_summary: org.page_summary,
        onboarding_completed: true,
      };

      const { data: inserted, error } = await supabase
        .from("organizations")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client infers never for insert; schema is correct
        .insert(insertPayload as any)
        .select("id")
        .single();

      if (error) continue;
      createdOrgIds.push((inserted as { id: string }).id);
    }

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    // Link to user (donor_saved_organizations)
    for (const oid of createdOrgIds) {
      await supabase
        .from("donor_saved_organizations")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- service client types
        .upsert({ user_id: user.id, organization_id: oid } as any, { onConflict: "user_id,organization_id" });
    }

    // Link to org (peer_connections) if user has an org
    if (orgId) {
      for (const oid of createdOrgIds) {
        if (oid === orgId) continue;
        await supabase
          .from("peer_connections")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- service client types
          .insert({ side_a_id: orgId, side_a_type: "organization", side_b_id: oid, side_b_type: "organization" } as any);
      }
    }

    // Create feed_items
    let feedCount = 0;
    for (let i = 0; i < createdOrgIds.length; i++) {
      const oid = createdOrgIds[i];
      const meta = MOCK_ORGS[i] ?? { name: "Organization", slug: "org" };
      const createdAt = new Date(Date.now() - i * 3600000).toISOString();

      await supabase
        .from("feed_items")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- service client types
        .insert({ item_type: "new_org", organization_id: oid, payload: { organization_name: meta.name, organization_slug: meta.slug, created_at: createdAt } } as any);
      feedCount++;

      await supabase
        .from("feed_items")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- service client types
        .insert({
          item_type: "donation",
          organization_id: oid,
          payload: {
            amount_cents: [2500, 5000, 10000, 1500, 7500][i % 5],
            organization_name: meta.name,
            organization_slug: meta.slug,
            created_at: createdAt,
          },
        } as any);
      feedCount++;

      await supabase
        .from("feed_items")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- service client types
        .insert({
          item_type: "goal_progress",
          organization_id: oid,
          payload: {
            campaign_name: "Annual Fund",
            current_amount_cents: [15000, 45000, 80000][i % 3],
            goal_amount_cents: 100000,
            organization_name: meta.name,
            organization_slug: meta.slug,
            created_at: createdAt,
          },
        } as any);
      feedCount++;
    }

    return NextResponse.json({
      ok: true,
      orgsCreated: createdOrgIds.length,
      feedItemsCreated: feedCount,
      message: "Visit /feed to see the newsfeed.",
    });
  } catch (e) {
    console.error("Seed mock orgs error:", e);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
