import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import type { Database } from "@/types/supabase";

async function canAccessOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data: org } = await supabase.from("organizations").select("owner_user_id").eq("id", orgId).single();
  if ((org as { owner_user_id?: string } | null)?.owner_user_id === userId) return true;
  const { data: admin } = await supabase
    .from("organization_admins")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!admin;
}

export async function GET() {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization selected" }, { status: 400 });

    const { data, error } = await supabase
      .from("org_goals")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("org-goals GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("org-goals GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list goals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization selected" }, { status: 400 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, orgId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Goal name is required" }, { status: 400 });

    const insert: Database["public"]["Tables"]["org_goals"]["Insert"] = {
      organization_id: orgId,
      name,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      access: body.access === "private" ? "private" : "workspace",
      start_date: typeof body.start_date === "string" && body.start_date ? body.start_date : null,
      end_date: typeof body.end_date === "string" && body.end_date ? body.end_date : null,
      target_value: body.target_value != null && body.target_value !== "" ? Number(body.target_value) : null,
      target_unit: typeof body.target_unit === "string" ? body.target_unit.trim() || null : null,
      owner_user_ids: Array.isArray(body.owner_user_ids) ? body.owner_user_ids : [],
    };

    const { data, error } = await supabase
      .from("org_goals")
      .insert(insert)
      .select()
      .single();

    if (error) {
      console.error("org-goals POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("org-goals POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create goal" },
      { status: 500 }
    );
  }
}
