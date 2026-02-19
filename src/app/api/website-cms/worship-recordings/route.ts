import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth";
import { triggerRepublish } from "@/lib/republish-site";

export async function GET(req: NextRequest) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? organizationId;
    if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("website_cms_worship_recordings")
      .select("*")
      .eq("organization_id", orgId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("website-cms worship-recordings GET:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("website-cms worship-recordings GET:", e);
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
      subtitle?: string | null;
      duration_text?: string | null;
      url?: string | null;
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
      subtitle: body.subtitle ?? null,
      duration_text: body.duration_text ?? null,
      url: body.url ?? null,
    };

    const { data, error } = await supabase
      .from("website_cms_worship_recordings")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("website-cms worship-recordings POST:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    triggerRepublish(orgId);
    return NextResponse.json(data);
  } catch (e) {
    console.error("website-cms worship-recordings POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create" },
      { status: 500 }
    );
  }
}
