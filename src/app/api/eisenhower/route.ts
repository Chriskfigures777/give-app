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

export async function GET() {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization selected" }, { status: 400 });

    const { data, error } = await supabase
      .from("eisenhower_items")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("eisenhower GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("eisenhower GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list items" },
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

    const quadrant = Math.min(4, Math.max(1, Number(body.quadrant) || 1));
    const insert = {
      organization_id: orgId,
      quadrant,
      title: typeof body.title === "string" ? body.title.trim() : "",
      content: typeof body.content === "string" ? body.content.trim() || null : null,
      position_x: Number(body.position_x) || 0,
      position_y: Number(body.position_y) || 0,
      color: typeof body.color === "string" && body.color ? body.color : "#fef08a",
    };

    const { data, error } = await supabase
      .from("eisenhower_items")
      .insert(insert)
      .select()
      .single();

    if (error) {
      console.error("eisenhower POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("eisenhower POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create item" },
      { status: 500 }
    );
  }
}
