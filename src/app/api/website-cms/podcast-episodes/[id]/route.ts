import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth";
import { triggerRepublish } from "@/lib/republish-site";

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
    if (body.episode_number != null) updates.episode_number = body.episode_number;
    if (body.title != null) updates.title = body.title;
    if (body.published_at != null) updates.published_at = body.published_at;
    if (body.duration_minutes != null) updates.duration_minutes = body.duration_minutes;
    if (body.audio_url != null) updates.audio_url = body.audio_url;

    const { data, error } = await supabase
      .from("website_cms_podcast_episodes")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("website-cms podcast-episodes PATCH:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (organizationId) triggerRepublish(organizationId);
    return NextResponse.json(data);
  } catch (e) {
    console.error("website-cms podcast-episodes PATCH:", e);
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
      .from("website_cms_podcast_episodes")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("website-cms podcast-episodes DELETE:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (organizationId) triggerRepublish(organizationId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("website-cms podcast-episodes DELETE:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
