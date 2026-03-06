import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { data, error } = await supabase
      .from("organization_surveys")
      .select("*")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("surveys GET [id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch survey" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof body.title === "string") updates.title = body.title.trim() || "Untitled survey";
    if (typeof body.description === "string") updates.description = body.description;
    if (Array.isArray(body.questions)) updates.questions = body.questions;
    if (typeof body.cover_image_url === "string") updates.cover_image_url = body.cover_image_url;
    if (body.theme && typeof body.theme === "object") updates.theme = body.theme;
    if (body.status === "draft" || body.status === "published" || body.status === "closed") updates.status = body.status;

    const { data, error } = await supabase
      .from("organization_surveys")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("surveys PATCH [id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update survey" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { error } = await supabase
      .from("organization_surveys")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("surveys DELETE [id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete survey" },
      { status: 500 }
    );
  }
}
