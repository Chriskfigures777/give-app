import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export type BlockType = "video" | "image" | "donation_form";

export type BlockConfig = {
  media_url?: string | null;
  title?: string | null;
  subtitle?: string | null;
  campaign_id?: string | null;
  design_set?: {
    media_type?: "image" | "video";
    media_url?: string | null;
    title?: string | null;
    subtitle?: string | null;
  } | null;
};

async function getOrgIdForAuth(
  profile: { role?: string; organization_id?: string | null; preferred_organization_id?: string | null } | null,
  bodyOrgId?: string | null
): Promise<string | null> {
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (profile?.role === "platform_admin" && bodyOrgId) return bodyOrgId;
  return orgId ?? null;
}

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

export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const organizationId =
      req.nextUrl.searchParams.get("organizationId") ?? (await getOrgIdForAuth(profile));

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, organizationId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("public_page_blocks")
      .select("id, organization_id, block_type, sort_order, config, is_enabled, created_at, updated_at")
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("public-page-blocks GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("public-page-blocks GET error:", e);
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

    const organizationId = await getOrgIdForAuth(profile, body.organizationId as string);
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, organizationId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const blockType = (body.block_type as BlockType) ?? "image";
    const validTypes: BlockType[] = ["video", "image", "donation_form"];
    if (!validTypes.includes(blockType)) {
      return NextResponse.json({ error: "Invalid block_type" }, { status: 400 });
    }

    const config = (body.config as BlockConfig) ?? {};
    const { data: maxOrder } = await supabase
      .from("public_page_blocks")
      .select("sort_order")
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const sortOrder = typeof body.sort_order === "number" ? body.sort_order : ((maxOrder as { sort_order?: number } | null)?.sort_order ?? -1) + 1;

    const insertPayload = {
      organization_id: organizationId,
      block_type: blockType,
      sort_order: sortOrder,
      config: config && typeof config === "object" ? config : {},
      is_enabled: body.is_enabled !== false,
    };

    const { data, error } = await supabase
      .from("public_page_blocks")
      // @ts-ignore - Supabase infers insert as never when table types are not fully synced
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("public-page-blocks POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("public-page-blocks POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create" },
      { status: 500 }
    );
  }
}
