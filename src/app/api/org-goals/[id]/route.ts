import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

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

async function ensureAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: { role?: string } | null,
  userId: string,
  goalId: string
) {
  const { data: row } = await supabase
    .from("org_goals")
    .select("organization_id")
    .eq("id", goalId)
    .single();
  const existing = row as { organization_id?: string } | null;
  if (!existing) return { status: 404 as const, error: "Not found" };
  if (profile?.role === "platform_admin") return { status: null as null, error: null };
  const canAccess = await canAccessOrg(supabase, userId, existing.organization_id!);
  if (!canAccess) return { status: 403 as const, error: "Forbidden" };
  return { status: null as null, error: null };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, supabase } = await requireAuth();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const access = await ensureAccess(supabase, profile, user.id, id);
    if (access.status) return NextResponse.json({ error: access.error }, { status: access.status });

    const { data, error } = await supabase.from("org_goals").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("org-goals [id] GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to get goal" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, supabase } = await requireAuth();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const access = await ensureAccess(supabase, profile, user.id, id);
    if (access.status) return NextResponse.json({ error: access.error }, { status: access.status });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) update.name = typeof body.name === "string" ? body.name.trim() : null;
    if (body.description !== undefined) update.description = typeof body.description === "string" ? body.description.trim() || null : null;
    if (body.access !== undefined) update.access = body.access === "private" ? "private" : "workspace";
    if (body.start_date !== undefined) update.start_date = typeof body.start_date === "string" && body.start_date ? body.start_date : null;
    if (body.end_date !== undefined) update.end_date = typeof body.end_date === "string" && body.end_date ? body.end_date : null;
    if (body.target_value !== undefined) update.target_value = body.target_value === null || body.target_value === "" ? null : Number(body.target_value);
    if (body.target_unit !== undefined) update.target_unit = typeof body.target_unit === "string" ? body.target_unit.trim() || null : null;
    if (body.owner_user_ids !== undefined) update.owner_user_ids = Array.isArray(body.owner_user_ids) ? body.owner_user_ids : [];

    const { data, error } = await supabase
      .from("org_goals")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("org-goals PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("org-goals PATCH error:", e);
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
    const { profile, supabase } = await requireAuth();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const access = await ensureAccess(supabase, profile, user.id, id);
    if (access.status) return NextResponse.json({ error: access.error }, { status: access.status });

    const { error } = await supabase.from("org_goals").delete().eq("id", id);
    if (error) {
      console.error("org-goals DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("org-goals DELETE error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
