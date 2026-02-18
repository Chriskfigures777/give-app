import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import type { TablesUpdate } from "@/types/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    const { id } = await params;

    if (!orgId && profile?.role !== "platform_admin") {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const { data: existingRow } = await supabase
      .from("organization_team_members")
      .select("organization_id")
      .eq("id", id)
      .single();

    const existing = existingRow as { organization_id?: string } | null;
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (profile?.role !== "platform_admin" && existing.organization_id !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const update: TablesUpdate<"organization_team_members"> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) update.name = (body.name as string)?.trim();
    if (body.role !== undefined) update.role = (body.role as string)?.trim() || null;
    if (body.bio !== undefined) update.bio = (body.bio as string)?.trim() || null;
    if (body.image_url !== undefined) update.image_url = (body.image_url as string)?.trim() || null;
    if (body.sort_order !== undefined) update.sort_order = body.sort_order as number;

    const { data, error } = await supabase
      .from("organization_team_members")
      // @ts-ignore - update() infers never for organization_team_members with createServerClient
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("team-members PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("organization-team-members PATCH error:", e);
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
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    const { id } = await params;

    if (!orgId && profile?.role !== "platform_admin") {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const { data: existingRow } = await supabase
      .from("organization_team_members")
      .select("organization_id")
      .eq("id", id)
      .single();

    const existing = existingRow as { organization_id?: string } | null;
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (profile?.role !== "platform_admin" && existing.organization_id !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("organization_team_members")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("team-members DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("organization-team-members DELETE error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
