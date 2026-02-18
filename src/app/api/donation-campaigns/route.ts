import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

async function canAccessOrg(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, orgId: string): Promise<boolean> {
  const { data: org } = await supabase.from("organizations").select("owner_user_id").eq("id", orgId).single();
  if ((org as { owner_user_id?: string } | null)?.owner_user_id === userId) return true;
  const { data: admin } = await supabase.from("organization_admins").select("id").eq("organization_id", orgId).eq("user_id", userId).maybeSingle();
  return !!admin;
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
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const insert: Record<string, unknown> = {
      organization_id: orgId,
      name,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      goal_amount_cents: body.goal_amount_cents != null && body.goal_amount_cents !== ""
        ? Math.max(0, Math.round(Number(body.goal_amount_cents)))
        : null,
      goal_deadline: typeof body.goal_deadline === "string" && body.goal_deadline ? body.goal_deadline : null,
      suggested_amounts: Array.isArray(body.suggested_amounts) ? body.suggested_amounts : [10, 25, 50, 100, 250, 500],
      minimum_amount_cents: body.minimum_amount_cents != null ? Math.max(0, Math.round(Number(body.minimum_amount_cents))) : 100,
      allow_recurring: body.allow_recurring === true,
      allow_anonymous: body.allow_anonymous !== false,
      is_active: body.is_active !== false,
    };

    const { data, error } = await supabase
      .from("donation_campaigns")
      // @ts-expect-error - Supabase insert payload typing
      .insert(insert)
      .select()
      .single();

    if (error) {
      console.error("donation-campaigns POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("donation-campaigns POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
}
