/**
 * GET  /api/crm/tags     — list all tags for the org
 * POST /api/crm/tags     — create a new tag
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { crmFrom } from "@/lib/crm/db";

export async function GET(_req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { data, error } = await crmFrom(supabase, "crm_tags")
      .select("id, name, color, created_at")
      .eq("organization_id", orgId)
      .order("name");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tags: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const body = await req.json() as { name?: string; color?: string };
    const name = body.name?.trim();
    if (!name) return NextResponse.json({ error: "Tag name is required" }, { status: 400 });

    const color = body.color?.trim() || "#6366f1";

    const { data, error } = await crmFrom(supabase, "crm_tags")
      .insert({ organization_id: orgId, name, color })
      .select("id, name, color, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A tag with that name already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tag: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
