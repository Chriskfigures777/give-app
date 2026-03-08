/**
 * PATCH /api/crm/tags/[id]  — update tag name/color
 * DELETE /api/crm/tags/[id] — delete a tag (removes all assignments)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { crmFrom } from "@/lib/crm/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const body = await req.json() as { name?: string; color?: string };
    const updates: Record<string, string> = {};
    if (body.name?.trim()) updates.name = body.name.trim();
    if (body.color?.trim()) updates.color = body.color.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await crmFrom(supabase, "crm_tags")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("id, name, color")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    return NextResponse.json({ tag: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { error } = await crmFrom(supabase, "crm_tags")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
