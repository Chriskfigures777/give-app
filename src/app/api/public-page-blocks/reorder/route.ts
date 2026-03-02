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

export async function PATCH(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();

    let body: { organizationId: string; order: string[] };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const organizationId = body.organizationId;
    const order = body.order;

    if (!organizationId || !Array.isArray(order) || order.length === 0) {
      return NextResponse.json(
        { error: "organizationId and order (array of block ids) required" },
        { status: 400 }
      );
    }

    const orgId = profile?.role === "platform_admin" ? organizationId : (profile?.organization_id ?? profile?.preferred_organization_id);
    if (!orgId || orgId !== organizationId) {
      if (profile?.role !== "platform_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, organizationId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates = order.map((id, index) => ({
      id,
      sort_order: index,
    }));

    for (const { id, sort_order } of updates) {
      const { error } = await supabase
        .from("public_page_blocks")
        // @ts-ignore - Supabase infers update as never when table types are not fully synced
        .update({ sort_order, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) {
        console.error("public-page-blocks reorder error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const { data, error } = await supabase
      .from("public_page_blocks")
      .select("id, organization_id, block_type, sort_order, config, is_enabled, created_at, updated_at")
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("public-page-blocks reorder error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to reorder" },
      { status: 500 }
    );
  }
}
