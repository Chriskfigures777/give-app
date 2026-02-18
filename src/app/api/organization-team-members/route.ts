import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.nextUrl.searchParams.get("organizationId");
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organization_team_members")
      .select("id, name, role, bio, image_url")
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("team-members GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("organization-team-members GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    if (!orgId && profile?.role !== "platform_admin") {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const organizationId = (body.organizationId as string) ?? orgId;
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    if (profile?.role !== "platform_admin" && organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const name = (body.name as string)?.trim();
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("organization_team_members")
      // @ts-ignore - insert() infers never for organization_team_members with createServerClient
      .insert({
        organization_id: organizationId,
        name,
        role: (body.role as string)?.trim() || null,
        bio: (body.bio as string)?.trim() || null,
        image_url: (body.image_url as string)?.trim() || null,
        sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      })
      .select()
      .single();

    if (error) {
      console.error("team-members POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("organization-team-members POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create" },
      { status: 500 }
    );
  }
}
