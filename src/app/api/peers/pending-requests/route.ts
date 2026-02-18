import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** GET: Incoming and outgoing pending peer requests for current user's org */
export async function GET() {
  try {
    const { supabase, profile } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    if (!orgId) {
      return NextResponse.json({ incoming: [], outgoing: [] });
    }

    const { data: incoming } = await supabase
      .from("peer_requests")
      .select("id, requester_id, requester_type, recipient_id, recipient_type, message, created_at")
      .eq("recipient_id", orgId)
      .eq("recipient_type", "organization")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: outgoing } = await supabase
      .from("peer_requests")
      .select("id, requester_id, requester_type, recipient_id, recipient_type, message, created_at")
      .eq("requester_id", orgId)
      .eq("requester_type", "organization")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);

    const orgIds = new Set<string>();
    for (const r of incoming ?? []) orgIds.add((r as { requester_id: string }).requester_id);
    for (const r of outgoing ?? []) orgIds.add((r as { recipient_id: string }).recipient_id);

    const orgInfo: Record<string, { name: string; slug: string }> = {};
    if (orgIds.size > 0) {
      const { data: orgRows } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .in("id", Array.from(orgIds));
      for (const row of orgRows ?? []) {
        const r = row as { id: string; name: string; slug: string };
        orgInfo[r.id] = { name: r.name ?? "Organization", slug: r.slug ?? "" };
      }
    }

    const incomingWithNames = (incoming ?? [])
      .filter((r) => (r as { requester_id: string }).requester_id !== orgId)
      .map((r) => {
      const row = r as { id: string; requester_id: string; created_at: string; message: string | null };
      const info = orgInfo[row.requester_id] ?? { name: "Organization", slug: "" };
      return {
        ...row,
        direction: "incoming" as const,
        organization_name: info.name,
        organization_slug: info.slug,
        organization_id: row.requester_id,
      };
    });

    const outgoingWithNames = (outgoing ?? [])
      .filter((r) => (r as { recipient_id: string }).recipient_id !== orgId)
      .map((r) => {
      const row = r as { id: string; recipient_id: string; created_at: string; message: string | null };
      const info = orgInfo[row.recipient_id] ?? { name: "Organization", slug: "" };
      return {
        ...row,
        direction: "outgoing" as const,
        organization_name: info.name,
        organization_slug: info.slug,
        organization_id: row.recipient_id,
      };
    });

    return NextResponse.json({
      incoming: incomingWithNames,
      outgoing: outgoingWithNames,
    });
  } catch {
    return NextResponse.json({ incoming: [], outgoing: [] }, { status: 401 });
  }
}
