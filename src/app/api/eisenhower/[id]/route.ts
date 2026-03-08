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
  itemId: string
) {
  const { data: row } = await supabase
    .from("eisenhower_items")
    .select("organization_id")
    .eq("id", itemId)
    .single();
  const existing = row as { organization_id?: string } | null;
  if (!existing) return { status: 404 as const, error: "Not found" };
  if (profile?.role === "platform_admin") return { status: null as null, error: null };
  const canAccess = await canAccessOrg(supabase, userId, existing.organization_id!);
  if (!canAccess) return { status: 403 as const, error: "Forbidden" };
  return { status: null as null, error: null };
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
    if (body.quadrant !== undefined) update.quadrant = Math.min(4, Math.max(1, Number(body.quadrant) || 1));
    if (body.title !== undefined) update.title = typeof body.title === "string" ? body.title.trim() : "";
    if (body.content !== undefined) update.content = typeof body.content === "string" ? body.content.trim() || null : null;
    if (body.position_x !== undefined) update.position_x = Number(body.position_x) || 0;
    if (body.position_y !== undefined) update.position_y = Number(body.position_y) || 0;
    if (body.color !== undefined) update.color = typeof body.color === "string" && body.color ? body.color : "#fef08a";

    const { data, error } = await supabase
      .from("eisenhower_items")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("eisenhower PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("eisenhower PATCH error:", e);
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

    const { error } = await supabase.from("eisenhower_items").delete().eq("id", id);
    if (error) {
      console.error("eisenhower DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("eisenhower DELETE error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
