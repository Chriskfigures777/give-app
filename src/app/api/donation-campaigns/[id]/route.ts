import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

async function canAccessOrg(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, orgId: string): Promise<boolean> {
  const { data: org } = await supabase.from("organizations").select("owner_user_id").eq("id", orgId).single();
  if ((org as { owner_user_id?: string } | null)?.owner_user_id === userId) return true;
  const { data: admin } = await supabase.from("organization_admins").select("id").eq("organization_id", orgId).eq("user_id", userId).maybeSingle();
  return !!admin;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, supabase } = await requireAuth();
    const { id } = await params;

    const { data: existingRow } = await supabase
      .from("donation_campaigns")
      .select("organization_id")
      .eq("id", id)
      .single();

    const existing = existingRow as { organization_id?: string } | null;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, existing.organization_id!);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.goal_amount_cents !== undefined) {
      const v = body.goal_amount_cents;
      update.goal_amount_cents = v === null || v === "" ? null : Math.max(0, Math.round(Number(v)));
    }
    if (body.goal_deadline !== undefined) {
      const v = body.goal_deadline;
      update.goal_deadline = v === null || v === "" ? null : v;
    }

    const { data, error } = await supabase
      .from("donation_campaigns")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("donation-campaigns PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("donation-campaigns PATCH error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update" },
      { status: 500 }
    );
  }
}
