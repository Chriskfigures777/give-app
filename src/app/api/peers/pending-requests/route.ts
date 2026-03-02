import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** GET: Incoming and outgoing pending peer requests for current user (or their org) */
export async function GET() {
  try {
    const { supabase, profile, user } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    // Build OR conditions for recipient (both org and user identity)
    // Incoming: requests where I am the recipient (as org or as user)
    const incomingOrgFilter = orgId
      ? supabase
          .from("peer_requests")
          .select("id, requester_id, requester_type, recipient_id, recipient_type, message, created_at")
          .eq("recipient_id", orgId)
          .eq("recipient_type", "organization")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(50)
      : null;

    const incomingUserFilter = supabase
      .from("peer_requests")
      .select("id, requester_id, requester_type, recipient_id, recipient_type, message, created_at")
      .eq("recipient_id", user.id)
      .eq("recipient_type", "user")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);

    const [incomingOrgRes, incomingUserRes] = await Promise.all([
      incomingOrgFilter ?? Promise.resolve({ data: [] }),
      incomingUserFilter,
    ]);

    const allIncoming = [
      ...(incomingOrgRes.data ?? []),
      ...(incomingUserRes.data ?? []),
    ] as {
      id: string;
      requester_id: string;
      requester_type: string;
      recipient_id: string;
      recipient_type: string;
      message: string | null;
      created_at: string;
    }[];

    // Collect IDs to resolve names
    const orgIds = new Set<string>();
    const userIds = new Set<string>();
    for (const r of allIncoming) {
      if (r.requester_type === "organization") orgIds.add(r.requester_id);
      else userIds.add(r.requester_id);
    }

    const orgInfo: Record<string, { name: string; slug: string }> = {};
    const userInfo: Record<string, { name: string }> = {};

    const [orgRes, userRes] = await Promise.all([
      orgIds.size > 0
        ? supabase.from("organizations").select("id, name, slug").in("id", Array.from(orgIds))
        : Promise.resolve({ data: [] }),
      userIds.size > 0
        ? supabase.from("user_profiles").select("id, full_name").in("id", Array.from(userIds))
        : Promise.resolve({ data: [] }),
    ]);

    for (const row of orgRes.data ?? []) {
      const r = row as { id: string; name: string; slug: string };
      orgInfo[r.id] = { name: r.name ?? "Organization", slug: r.slug ?? "" };
    }
    for (const row of userRes.data ?? []) {
      const r = row as { id: string; full_name: string | null };
      userInfo[r.id] = { name: r.full_name ?? "Member" };
    }

    const incomingWithNames = allIncoming.map((r) => {
      if (r.requester_type === "organization") {
        const info = orgInfo[r.requester_id] ?? { name: "Organization", slug: "" };
        return {
          ...r,
          direction: "incoming" as const,
          display_name: info.name,
          organization_name: info.name,
          organization_slug: info.slug,
          organization_id: r.requester_id,
        };
      } else {
        const info = userInfo[r.requester_id] ?? { name: "Member" };
        return {
          ...r,
          direction: "incoming" as const,
          display_name: info.name,
          organization_name: info.name,
          organization_slug: "",
          organization_id: null,
        };
      }
    });

    return NextResponse.json({ incoming: incomingWithNames, outgoing: [] });
  } catch {
    return NextResponse.json({ incoming: [], outgoing: [] }, { status: 401 });
  }
}
