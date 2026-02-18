import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

async function canAccessOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data: org } = await supabase
    .from("organizations")
    .select("owner_user_id")
    .eq("id", orgId)
    .single();
  if ((org as { owner_user_id?: string } | null)?.owner_user_id === userId) return true;
  const { data: admin } = await supabase
    .from("organization_admins")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!admin;
}

/**
 * Seeds public_page_blocks from existing organization profile data.
 * Only runs when the org has no blocks. Creates hero (video or image) block only.
 */
export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    let body: { organizationId: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const organizationId = body.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const orgId = profile?.role === "platform_admin" ? organizationId : (profile?.organization_id ?? profile?.preferred_organization_id);
    if (!orgId || (profile?.role !== "platform_admin" && orgId !== organizationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, organizationId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: existingBlocks } = await supabase
      .from("public_page_blocks")
      .select("id")
      .eq("organization_id", organizationId)
      .limit(1);

    if (existingBlocks && existingBlocks.length > 0) {
      return NextResponse.json(
        { error: "Organization already has blocks. Seed only runs when there are none." },
        { status: 400 }
      );
    }

    const { data: orgRow } = await supabase
      .from("organizations")
      .select("name, page_hero_video_url, page_hero_image_url, page_summary, page_mission, page_story")
      .eq("id", organizationId)
      .single();

    const org = orgRow as {
      name: string;
      page_hero_video_url: string | null;
      page_hero_image_url: string | null;
      page_summary: string | null;
      page_mission: string | null;
      page_story: string | null;
    } | null;

    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const blocksToInsert: Array<{
      organization_id: string;
      block_type: "video" | "image";
      sort_order: number;
      config: Record<string, unknown>;
      is_enabled: boolean;
    }> = [];

    let sortOrder = 0;

    if (org.page_hero_video_url?.trim()) {
      blocksToInsert.push({
        organization_id: organizationId,
        block_type: "video",
        sort_order: sortOrder++,
        config: {
          media_url: org.page_hero_video_url.trim(),
          title: org.name,
          subtitle: org.page_summary?.trim() || null,
        },
        is_enabled: true,
      });
    } else if (org.page_hero_image_url?.trim()) {
      blocksToInsert.push({
        organization_id: organizationId,
        block_type: "image",
        sort_order: sortOrder++,
        config: {
          media_url: org.page_hero_image_url.trim(),
          title: org.name,
          subtitle: org.page_summary?.trim() || null,
        },
        is_enabled: true,
      });
    }

    if (blocksToInsert.length === 0) {
      blocksToInsert.push({
        organization_id: organizationId,
        block_type: "image",
        sort_order: sortOrder++,
        config: { title: org.name, subtitle: org.page_summary?.trim() || null },
        is_enabled: true,
      });
    }

    blocksToInsert.push({
      organization_id: organizationId,
      block_type: "image",
      sort_order: sortOrder++,
      config: {
        title: "About us",
        subtitle: org.page_mission?.trim() || org.page_summary?.trim() || null,
      },
      is_enabled: true,
    });

    blocksToInsert.push({
      organization_id: organizationId,
      block_type: "image",
      sort_order: sortOrder++,
      config: {
        title: "Our story",
        subtitle: org.page_story?.trim() || null,
      },
      is_enabled: true,
    });

    const { data: inserted, error } = await supabase
      .from("public_page_blocks")
      // @ts-ignore - Supabase infers insert as never when table types are not fully synced
      .insert(blocksToInsert)
      .select("id, block_type, sort_order, config, is_enabled");

    if (error) {
      console.error("public-page-blocks seed error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, blocks: inserted });
  } catch (e) {
    console.error("public-page-blocks seed error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to seed" },
      { status: 500 }
    );
  }
}
