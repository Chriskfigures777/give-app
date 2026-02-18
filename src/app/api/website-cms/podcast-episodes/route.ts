import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? organizationId;
    if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("website_cms_podcast_episodes")
      .select("*")
      .eq("organization_id", orgId)
      .order("sort_order", { ascending: true })
      .order("episode_number", { ascending: false });

    if (error) {
      console.error("website-cms podcast-episodes GET:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("website-cms podcast-episodes GET:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    let body: {
      organizationId?: string;
      episode_number: number;
      title: string;
      published_at?: string | null;
      duration_minutes?: number | null;
      audio_url?: string | null;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const orgId = body.organizationId ?? organizationId;
    if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

    const payload = {
      organization_id: orgId,
      episode_number: body.episode_number ?? 1,
      title: body.title.trim(),
      published_at: body.published_at ?? null,
      duration_minutes: body.duration_minutes ?? null,
      audio_url: body.audio_url ?? null,
    };

    const { data, error } = await supabase
      .from("website_cms_podcast_episodes")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("website-cms podcast-episodes POST:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("website-cms podcast-episodes POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create" },
      { status: 500 }
    );
  }
}
