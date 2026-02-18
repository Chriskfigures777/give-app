import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    if (!orgId && profile?.role !== "platform_admin") {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const orgIdParam = req.nextUrl.searchParams.get("organizationId") ?? orgId;
    if (!orgIdParam) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, slug, logo_url, website_url, profile_image_url, page_hero_video_url, page_hero_image_url, page_summary, page_mission, page_goals, page_story, page_story_image_url, page_donation_goal_cents, card_preview_image_url, card_preview_video_url, page_about_image_side, page_story_image_side")
      .eq("id", orgIdParam)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("organization-profile GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    if (!orgId && profile?.role !== "platform_admin") {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const orgIdParam = (body.organizationId as string) ?? orgId;
    if (!orgIdParam) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    const allowed = [
      "profile_image_url",
      "logo_url",
      "website_url",
      "page_hero_video_url",
      "page_hero_image_url",
      "page_summary",
      "page_mission",
      "page_goals",
      "page_story",
      "page_story_image_url",
      "page_donation_goal_cents",
      "card_preview_image_url",
      "card_preview_video_url",
      "page_about_image_side",
      "page_story_image_side",
    ];
    for (const key of allowed) {
      if (key in body) {
        let val = body[key];
        if (key === "page_about_image_side" || key === "page_story_image_side") {
          const s = typeof val === "string" ? val : String(val ?? "");
          updatePayload[key] = s === "right" ? "right" : "left";
        } else {
          updatePayload[key] = val;
        }
      }
    }

    const { data, error } = await supabase
      .from("organizations")
      .update(updatePayload)
      .eq("id", orgIdParam)
      .select()
      .single();

    if (error) {
      console.error("organization-profile PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("organization-profile PATCH error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
