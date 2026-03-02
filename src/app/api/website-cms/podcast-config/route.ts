import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth";
import { triggerRepublish } from "@/lib/republish-site";

export async function GET(req: NextRequest) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? organizationId;
    if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("website_cms_podcast_config")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) {
      console.error("website-cms podcast-config GET:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? { title: "Grace Daily Podcast", description: null, spotify_url: null, apple_podcasts_url: null, youtube_url: null });
  } catch (e) {
    console.error("website-cms podcast-config GET:", e);
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
      description?: string;
      spotify_url?: string | null;
      apple_podcasts_url?: string | null;
      youtube_url?: string | null;
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
      title: body.title ?? "Grace Daily Podcast",
      description: body.description ?? null,
      spotify_url: body.spotify_url ?? null,
      apple_podcasts_url: body.apple_podcasts_url ?? null,
      youtube_url: body.youtube_url ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("website_cms_podcast_config")
      .upsert(payload, {
        onConflict: "organization_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error("website-cms podcast-config PUT:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    triggerRepublish(orgId);
    return NextResponse.json(data);
  } catch (e) {
    console.error("website-cms podcast-config PUT:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save" },
      { status: 500 }
    );
  }
}
