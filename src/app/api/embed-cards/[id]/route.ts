import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import type { EmbedCardStyle, EmbedCardPageSection } from "../route";
import { syncCardDesignToFormCustomization } from "../route";

async function canAccessOrg(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, orgId: string): Promise<boolean> {
  const { data: org } = await supabase.from("organizations").select("owner_user_id").eq("id", orgId).single();
  if ((org as { owner_user_id?: string } | null)?.owner_user_id === userId) return true;
  const { data: admin } = await supabase.from("organization_admins").select("id").eq("organization_id", orgId).eq("user_id", userId).maybeSingle();
  return !!admin;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, supabase } = await requireAuth();
    const { id } = await params;

    const { data: existingRow } = await supabase
      .from("org_embed_cards")
      .select("organization_id")
      .eq("id", id)
      .single();

    const existing = existingRow as { organization_id?: string } | null;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, existing.organization_id!);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.restore === true) update.deleted_at = null;
    if (body.name !== undefined) update.name = (body.name as string)?.trim();
    if (body.style !== undefined) {
      const validStyles: EmbedCardStyle[] = ["full", "compressed", "goal", "goal_compact", "minimal"];
      if (validStyles.includes(body.style as EmbedCardStyle)) update.style = body.style;
    }
    if (body.campaign_id !== undefined) update.campaign_id = (body.campaign_id as string)?.trim() || null;
    if (body.design_set !== undefined) {
      const raw = body.design_set as { media_type?: string; media_url?: string | null; title?: string | null; subtitle?: string | null } | null;
      update.design_set = raw && typeof raw === "object"
        ? {
            media_type: raw.media_type === "video" ? "video" : "image",
            media_url: typeof raw.media_url === "string" ? raw.media_url.trim() || null : null,
            title: typeof raw.title === "string" ? raw.title.trim() || null : null,
            subtitle: typeof raw.subtitle === "string" ? raw.subtitle.trim() || null : null,
          }
        : { media_type: "image", media_url: null, title: null, subtitle: null };
    }
    if (body.button_color !== undefined) update.button_color = (body.button_color as string)?.trim() || null;
    if (body.button_text_color !== undefined) update.button_text_color = (body.button_text_color as string)?.trim() || null;
    if (body.primary_color !== undefined) update.primary_color = (body.primary_color as string)?.trim() || null;
    if (body.is_enabled !== undefined) update.is_enabled = body.is_enabled;
    if (body.page_section !== undefined) {
      const validSections: EmbedCardPageSection[] = ["donation", "hero", "about", "team", "story"];
      if (validSections.includes(body.page_section as EmbedCardPageSection)) update.page_section = body.page_section;
    }
    if (body.sort_order !== undefined) update.sort_order = typeof body.sort_order === "number" ? body.sort_order : 0;
    if (body.goal_description !== undefined) update.goal_description = (body.goal_description as string)?.trim() || null;
    if (body.splits !== undefined) {
      const { SPLITS_ENABLED } = await import("@/lib/feature-flags");
      if (!SPLITS_ENABLED) {
        update.splits = [];
      } else {
        const splits = body.splits as { percentage: number; accountId: string }[] | null;
        const valid = Array.isArray(splits) && splits.every((s) => typeof s?.percentage === "number" && typeof s?.accountId === "string");
        update.splits = valid ? splits : [];
      }
    }

    const { data, error } = await supabase
      .from("org_embed_cards")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("embed-cards PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync card design to form_customizations so live preview updates
    const designSet = (data as { design_set?: { media_type?: string; media_url?: string | null; title?: string | null; subtitle?: string | null } } | null)?.design_set;
    if (designSet && typeof designSet === "object") {
      await syncCardDesignToFormCustomization(supabase, existing.organization_id!, {
        media_type: designSet.media_type === "video" ? "video" : "image",
        media_url: designSet.media_url ?? null,
        title: designSet.title ?? null,
        subtitle: designSet.subtitle ?? null,
      });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("embed-cards PATCH error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, supabase } = await requireAuth();
    const { id } = await params;

    const { data: existingRow } = await supabase
      .from("org_embed_cards")
      .select("organization_id")
      .eq("id", id)
      .single();

    const existing = existingRow as { organization_id?: string } | null;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, existing.organization_id!);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("org_embed_cards")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("embed-cards DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("embed-cards DELETE error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
