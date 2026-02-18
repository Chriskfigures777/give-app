import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/** GET: List peer connections */
export async function GET(req: NextRequest) {
  try {
    const { supabase, user, profile } = await requireAuth();

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    const { data: allConnections } = await supabase
      .from("peer_connections")
      .select("id, side_a_id, side_a_type, side_b_id, side_b_type, created_at")
      .order("created_at", { ascending: false });

    type Conn = { id: string; side_a_id: string; side_a_type: string; side_b_id: string; side_b_type: string };
    const filtered = ((allConnections ?? []) as Conn[]).filter(
      (c) =>
        (c.side_a_type === "user" && c.side_a_id === user.id) ||
        (c.side_b_type === "user" && c.side_b_id === user.id) ||
        (c.side_a_type === "organization" && c.side_a_id === orgId) ||
        (c.side_b_type === "organization" && c.side_b_id === orgId)
    );

    const filteredExcludingSelf = (filtered as Conn[]).filter((conn) => {
      const otherIsA =
        (conn.side_a_type === "user" && conn.side_a_id !== user.id) ||
        (conn.side_a_type === "organization" && conn.side_a_id !== orgId);
      const otherId = otherIsA ? conn.side_a_id : conn.side_b_id;
      const otherType = otherIsA ? conn.side_a_type : conn.side_b_type;
      return !(otherType === "organization" && otherId === orgId);
    });

    const withThreadsAndOrgs = await Promise.all(
      filteredExcludingSelf.map(async (conn) => {
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id")
          .eq("connection_id", conn.id)
          .single();
        const threadId = (thread as { id: string } | null)?.id ?? null;

        const otherIsA =
          (conn.side_a_type === "user" && conn.side_a_id !== user.id) ||
          (conn.side_a_type === "organization" && conn.side_a_id !== orgId);
        const otherId = otherIsA ? conn.side_a_id : conn.side_b_id;
        const otherType = otherIsA ? conn.side_a_type : conn.side_b_type;

        let otherName = "Unknown";
        let otherOrgSlug: string | null = null;
        let otherProfileImageUrl: string | null = null;
        let otherLogoUrl: string | null = null;
        if (otherType === "organization") {
          const { data: o } = await supabase
            .from("organizations")
            .select("name, slug, profile_image_url, logo_url")
            .eq("id", otherId)
            .single();
          const oRow = o as { name: string; slug: string; profile_image_url: string | null; logo_url: string | null } | null;
          otherName = oRow?.name ?? "Organization";
          otherOrgSlug = oRow?.slug ?? null;
          otherProfileImageUrl = oRow?.profile_image_url ?? null;
          otherLogoUrl = oRow?.logo_url ?? null;
        } else {
          const { data: p } = await supabase.from("user_profiles").select("full_name, email").eq("id", otherId).single();
          const pRow = p as { full_name: string | null; email: string | null } | null;
          otherName = pRow?.full_name || pRow?.email || "User";
        }

        return { ...conn, threadId, otherId, otherType, otherName, otherOrgSlug, otherProfileImageUrl, otherLogoUrl };
      })
    );

    const seen = new Set<string>();
    const deduped = withThreadsAndOrgs.filter((c) => {
      const key = `${c.otherType}:${c.otherId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ connections: deduped });
  } catch (e) {
    console.error("Connections GET error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
