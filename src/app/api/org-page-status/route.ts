import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET ?organizationId=xxx
 * Returns status for the org page: connection state (for org-to-org), saved state (for donors).
 * Does not require auth - returns isAuthenticated: false when not logged in.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const orgId = req.nextUrl.searchParams.get("organizationId");
    if (!orgId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({
        isAuthenticated: false,
        connectionStatus: "none" as const,
        isSaved: false,
        userOrgId: null,
      });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id, preferred_organization_id")
      .eq("id", user.id)
      .single();

    const userOrgId = (profile as { organization_id: string | null; preferred_organization_id: string | null } | null)
      ?.organization_id ?? (profile as { organization_id: string | null; preferred_organization_id: string | null } | null)
      ?.preferred_organization_id ?? null;

    let connectionStatus: "none" | "pending" | "connected" = "none";
    if (userOrgId && userOrgId !== orgId) {
      const [{ data: connections }, { data: pendingRequest }] = await Promise.all([
        supabase
          .from("peer_connections")
          .select("id, side_a_id, side_b_id")
          .eq("side_a_type", "organization")
          .eq("side_b_type", "organization")
          .or(`and(side_a_id.eq.${userOrgId},side_b_id.eq.${orgId}),and(side_a_id.eq.${orgId},side_b_id.eq.${userOrgId})`),
        supabase
          .from("peer_requests")
          .select("id")
          .eq("requester_id", userOrgId)
          .eq("recipient_id", orgId)
          .eq("status", "pending")
          .maybeSingle(),
      ]);

      const conns = (connections ?? []) as { side_a_id: string; side_b_id: string }[];
      const isConnected = conns.some(
        (c) =>
          (c.side_a_id === userOrgId && c.side_b_id === orgId) ||
          (c.side_a_id === orgId && c.side_b_id === userOrgId)
      );
      if (isConnected) connectionStatus = "connected";
      else if (pendingRequest) connectionStatus = "pending";
    }

    const { data: savedRow } = await supabase
      .from("donor_saved_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .maybeSingle();

    return NextResponse.json({
      isAuthenticated: true,
      connectionStatus,
      isSaved: !!savedRow,
      userOrgId,
    });
  } catch (e) {
    console.error("org-page-status GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch status" },
      { status: 500 }
    );
  }
}
