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

async function ensureAccessToGoal(
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
    const { id: goalId } = await params;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const access = await ensureAccessToGoal(supabase, profile, user.id, goalId);
    if (access.status) return NextResponse.json({ error: access.error }, { status: access.status });

    const { data, error } = await supabase
      .from("org_goal_updates")
      .select("*")
      .eq("goal_id", goalId)
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("org-goal-updates GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("org-goal-updates GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list updates" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, supabase } = await requireAuth();
    const { id: goalId } = await params;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const access = await ensureAccessToGoal(supabase, profile, user.id, goalId);
    if (access.status) return NextResponse.json({ error: access.error }, { status: access.status });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const valueNumber = body.value_number != null && body.value_number !== "" ? Number(body.value_number) : null;
    const valueText = typeof body.value_text === "string" ? body.value_text.trim() || null : null;
    const note = typeof body.note === "string" ? body.note.trim() || null : null;
    const recordedAt = typeof body.recorded_at === "string" && body.recorded_at
      ? body.recorded_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const insert = {
      goal_id: goalId,
      value_number: valueNumber,
      value_text: valueText,
      note,
      recorded_at: recordedAt,
    };

    const { data, error } = await supabase
      .from("org_goal_updates")
      .insert(insert)
      .select()
      .single();

    if (error) {
      console.error("org-goal-updates POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("org-goal-updates POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add update" },
      { status: 500 }
    );
  }
}
