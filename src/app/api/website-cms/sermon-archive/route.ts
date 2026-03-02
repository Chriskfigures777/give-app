import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth";
import { triggerRepublish } from "@/lib/republish-site";

export async function GET(req: NextRequest) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? organizationId;
    if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("website_cms_sermon_archive")
      .select("*")
      .eq("organization_id", orgId)
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false });

    if (error) {
      console.error("website-cms sermon-archive GET:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("website-cms sermon-archive GET:", e);
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
      title: string;
      tag?: string | null;
      image_url?: string | null;
      published_at?: string | null;
      duration_minutes?: number | null;
      speaker_name?: string | null;
      video_url?: string | null;
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
      title: body.title.trim(),
      tag: body.tag ?? null,
      image_url: body.image_url ?? null,
      published_at: body.published_at ?? null,
      duration_minutes: body.duration_minutes ?? null,
      speaker_name: body.speaker_name ?? null,
      video_url: body.video_url ?? null,
      audio_url: body.audio_url ?? null,
    };

    const { data, error } = await supabase
      .from("website_cms_sermon_archive")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("website-cms sermon-archive POST:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    triggerRepublish(orgId);
    return NextResponse.json(data);
  } catch (e) {
    console.error("website-cms sermon-archive POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create" },
      { status: 500 }
    );
  }
}
