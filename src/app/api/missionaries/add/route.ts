import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/** POST: Organization adds a giver as missionary. Body: { giverEmail: string } or { userId: string } */
export async function POST(req: NextRequest) {
  try {
    const { user, profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    if (!orgId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const giverEmail = (body.giverEmail as string)?.trim();
    const userId = body.userId as string | undefined;

    let targetUserId: string | null = null;

    if (userId) {
      targetUserId = userId;
    } else if (giverEmail) {
      const { data: profileRow } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", giverEmail)
        .single();
      targetUserId = (profileRow as { id: string } | null)?.id ?? null;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: giverEmail ? `No account found for ${giverEmail}. They need to sign up first.` : "User ID or email required" },
        { status: 404 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Cannot add yourself as missionary" }, { status: 400 });
    }

    const { data: targetProfile } = await supabase
      .from("user_profiles")
      .select("id, role, is_missionary, missionary_sponsor_org_id")
      .eq("id", targetUserId)
      .single();

    const target = targetProfile as { id: string; role: string; is_missionary: boolean | null; missionary_sponsor_org_id: string | null } | null;
    if (!target) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    if (target.missionary_sponsor_org_id && target.missionary_sponsor_org_id !== orgId) {
      return NextResponse.json(
        { error: "This person is already a missionary for another organization" },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    const { error: updateError } = await service
      .from("user_profiles")
      .update({
        role: "missionary",
        is_missionary: true,
        missionary_sponsor_org_id: orgId,
        plans_to_be_missionary: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: connA } = await service
      .from("peer_connections")
      .select("id")
      .eq("side_a_id", targetUserId)
      .eq("side_a_type", "user")
      .eq("side_b_id", orgId)
      .eq("side_b_type", "organization")
      .maybeSingle();

    const { data: connB } = connA
      ? { data: null }
      : await service
          .from("peer_connections")
          .select("id")
          .eq("side_a_id", orgId)
          .eq("side_a_type", "organization")
          .eq("side_b_id", targetUserId)
          .eq("side_b_type", "user")
          .maybeSingle();

    if (!connA && !connB) {
      const { error: connErr } = await service.from("peer_connections").insert({
        side_a_id: targetUserId,
        side_a_type: "user",
        side_b_id: orgId,
        side_b_type: "organization",
      });
      if (connErr && connErr.code !== "23505") {
        console.error("peer_connections insert:", connErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
