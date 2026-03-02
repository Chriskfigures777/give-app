import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth";
import { triggerRepublish } from "@/lib/republish-site";

export async function GET(req: NextRequest) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? organizationId;
    if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("website_cms_featured_sermon")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) {
      console.error("website-cms featured-sermon GET:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("website-cms featured-sermon GET:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    let body: {
      organizationId?: string;
      title?: string;
      tag?: string;
      description?: string;
      image_url?: string;
      video_url?: string;
      audio_url?: string;
      duration_minutes?: number;
      speaker_name?: string;
      published_at?: string | null;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const orgId = body.organizationId ?? organizationId;
    if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

    const payload = {
      organization_id: orgId,
      title: body.title ?? "Featured Sermon",
      tag: body.tag ?? null,
      description: body.description ?? null,
      image_url: body.image_url ?? null,
      video_url: body.video_url ?? null,
      audio_url: body.audio_url ?? null,
      duration_minutes: body.duration_minutes ?? null,
      speaker_name: body.speaker_name ?? null,
      published_at: body.published_at ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("website_cms_featured_sermon")
      .upsert(payload, {
        onConflict: "organization_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error("website-cms featured-sermon PUT:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    triggerRepublish(orgId);
    return NextResponse.json(data);
  } catch (e) {
    console.error("website-cms featured-sermon PUT:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save" },
      { status: 500 }
    );
  }
}
