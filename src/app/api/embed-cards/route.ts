import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export type EmbedCardStyle = "full" | "compressed" | "goal" | "goal_compact" | "minimal";
export type EmbedCardPageSection = "donation" | "hero" | "about" | "team" | "story";

export type DesignSetPayload = {
  media_type: "image" | "video";
  media_url: string | null;
  title: string | null;
  subtitle: string | null;
};

function getOrgIdForAuth(profile: { role?: string; organization_id?: string | null; preferred_organization_id?: string | null } | null, bodyOrgId?: string | null): string | null {
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (profile?.role === "platform_admin" && bodyOrgId) return bodyOrgId;
  return orgId ?? null;
}

export async function syncCardDesignToFormCustomization(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  designSet: DesignSetPayload
) {
  const designSets = [designSet];
  const { data: existing } = await supabase
    .from("form_customizations")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  const update: Record<string, unknown> = { design_sets: designSets };
  if (existing) {
    await supabase.from("form_customizations").update(update).eq("organization_id", organizationId);
  } else {
    await supabase.from("form_customizations").insert({
      organization_id: organizationId,
      ...update,
    });
  }
}

function canAccessOrg(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, orgId: string): Promise<boolean> {
  return (async () => {
    const { data: org } = await supabase.from("organizations").select("owner_user_id").eq("id", orgId).single();
    if ((org as { owner_user_id?: string } | null)?.owner_user_id === userId) return true;
    const { data: admin } = await supabase.from("organization_admins").select("id").eq("organization_id", orgId).eq("user_id", userId).maybeSingle();
    return !!admin;
  })();
}

export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const organizationId = req.nextUrl.searchParams.get("organizationId") ?? getOrgIdForAuth(profile);

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, organizationId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const includeDeleted = req.nextUrl.searchParams.get("includeDeleted") === "true";
    const deletedOnly = req.nextUrl.searchParams.get("deletedOnly") === "true";
    let query = supabase
      .from("org_embed_cards")
      .select("id, name, style, campaign_id, design_set, button_color, button_text_color, button_border_radius, primary_color, is_enabled, page_section, sort_order, goal_description, splits, created_at, updated_at, deleted_at")
      .eq("organization_id", organizationId);
    if (deletedOnly) {
      query = query.not("deleted_at", "is", null);
    } else if (!includeDeleted) {
      query = query.is("deleted_at", null);
    }
    const { data, error } = await query.order(deletedOnly ? "deleted_at" : "sort_order", { ascending: deletedOnly ? false : true }).limit(100);

    if (error) {
      console.error("embed-cards GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("embed-cards GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const organizationId = getOrgIdForAuth(profile, body.organizationId as string);
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, organizationId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const name = (body.name as string)?.trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const style = (body.style as EmbedCardStyle) ?? "full";
    const validStyles: EmbedCardStyle[] = ["full", "compressed", "goal", "goal_compact", "minimal"];
    if (!validStyles.includes(style)) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }

    if (["goal", "goal_compact"].includes(style)) {
      const campaignId = body.campaign_id as string | null | undefined;
      if (!campaignId) return NextResponse.json({ error: "campaign_id required for goal styles" }, { status: 400 });
    }

    const rawDesignSet = body.design_set as DesignSetPayload | null | undefined;
    const designSet = rawDesignSet && typeof rawDesignSet === "object"
      ? {
          media_type: rawDesignSet.media_type === "video" ? "video" as const : "image" as const,
          media_url: typeof rawDesignSet.media_url === "string" ? rawDesignSet.media_url.trim() || null : null,
          title: typeof rawDesignSet.title === "string" ? rawDesignSet.title.trim() || null : null,
          subtitle: typeof rawDesignSet.subtitle === "string" ? rawDesignSet.subtitle.trim() || null : null,
        }
      : { media_type: "image" as const, media_url: null, title: null, subtitle: null };
    const splits = body.splits as { percentage: number; accountId: string }[] | null | undefined;
    const validSplits = Array.isArray(splits) && splits.every((s) => typeof s?.percentage === "number" && typeof s?.accountId === "string") ? splits : [];
    const insertPayload = {
      organization_id: organizationId,
      name,
      style,
      campaign_id: (body.campaign_id as string)?.trim() || null,
      design_set: designSet,
      button_color: (body.button_color as string)?.trim() || null,
      button_text_color: (body.button_text_color as string)?.trim() || null,
      button_border_radius: (body.button_border_radius as string)?.trim() || null,
      primary_color: (body.primary_color as string)?.trim() || null,
      is_enabled: body.is_enabled !== false,
      page_section: (body.page_section as EmbedCardPageSection) || "donation",
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      goal_description: (body.goal_description as string)?.trim() || null,
      splits: validSplits,
    };

    const { data, error } = await supabase
      .from("org_embed_cards")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("embed-cards POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync card design to form_customizations so live preview updates
    await syncCardDesignToFormCustomization(supabase, organizationId, designSet);

    return NextResponse.json(data);
  } catch (e) {
    console.error("embed-cards POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create" },
      { status: 500 }
    );
  }
}
