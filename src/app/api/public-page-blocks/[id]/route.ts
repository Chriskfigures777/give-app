import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import type { TablesUpdate, Json } from "@/types/supabase";
import type { BlockType } from "../route";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, supabase } = await requireAuth();
    const { id } = await params;

    const { data: existingRow } = await supabase
      .from("public_page_blocks")
      .select("organization_id")
      .eq("id", id)
      .single();

    const existing = existingRow as { organization_id?: string } | null;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    const update: TablesUpdate<"public_page_blocks"> = { updated_at: new Date().toISOString() };
    if (body.block_type !== undefined) {
      const validTypes: BlockType[] = ["video", "image", "donation_form"];
      const bt = String(body.block_type);
      if (validTypes.includes(bt as BlockType)) update.block_type = bt;
    }
    if (body.sort_order !== undefined) update.sort_order = typeof body.sort_order === "number" ? body.sort_order : 0;
    if (body.config !== undefined) {
      let configVal = body.config;
      if (typeof configVal === "string") {
        try {
          configVal = JSON.parse(configVal);
        } catch {
          configVal = {};
        }
      }
      update.config = (configVal && typeof configVal === "object" ? configVal : {}) as Json;
    }
    if (body.is_enabled !== undefined) update.is_enabled = Boolean(body.is_enabled);

    const { data, error } = await supabase
      .from("public_page_blocks")
      // @ts-ignore - Supabase infers update as never when table types are not fully synced
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("public-page-blocks PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("public-page-blocks PATCH error:", e);
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
      .from("public_page_blocks")
      .select("organization_id")
      .eq("id", id)
      .single();

    const existing = existingRow as { organization_id?: string } | null;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, existing.organization_id!);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("public_page_blocks").delete().eq("id", id);

    if (error) {
      console.error("public-page-blocks DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("public-page-blocks DELETE error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
