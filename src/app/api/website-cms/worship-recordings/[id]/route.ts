import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, organizationId } = await requireOrgAdmin();
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 400 });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title != null) updates.title = body.title;
    if (body.subtitle != null) updates.subtitle = body.subtitle;
    if (body.duration_text != null) updates.duration_text = body.duration_text;
    if (body.url != null) updates.url = body.url;

    const { data, error } = await supabase
      .from("website_cms_worship_recordings")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("website-cms worship-recordings PATCH:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("website-cms worship-recordings PATCH:", e);
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
    const { id } = await params;
    const { supabase, organizationId } = await requireOrgAdmin();
    if (!organizationId) return NextResponse.json({ error: "Organization required" }, { status: 400 });

    const { error } = await supabase
      .from("website_cms_worship_recordings")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("website-cms worship-recordings DELETE:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("website-cms worship-recordings DELETE:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
