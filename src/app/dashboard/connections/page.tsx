import { requireAuth } from "@/lib/auth";
import { ConnectionsClient } from "./connections-client";

/** Connections: works for all users — org owners use org identity, individual members use user identity */
export default async function ConnectionsPage() {
  const { supabase, user, profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  // Determine caller identity
  const callerId = orgId ?? user.id;
  const callerType = orgId ? "organization" : "user";

  // Incoming pending requests — for org OR for user
  const [toOrgRes, toUserRes] = await Promise.all([
    orgId
      ? supabase
          .from("peer_requests")
          .select("id, requester_id, requester_type, recipient_id, recipient_type, message, created_at")
          .eq("recipient_id", orgId)
          .eq("recipient_type", "organization")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
    supabase
      .from("peer_requests")
      .select("id, requester_id, requester_type, recipient_id, recipient_type, message, created_at")
      .eq("recipient_id", user.id)
      .eq("recipient_type", "user")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  type PeerRequestRow = {
    id: string;
    requester_id: string;
    requester_type: string;
    recipient_id: string;
    recipient_type: string;
    message: string | null;
    created_at: string;
  };

  const pendingReceived = [
    ...(toOrgRes.data ?? []),
    ...(toUserRes.data ?? []),
  ] as PeerRequestRow[];

  // My connections — as org or as user
  const { data: connections } = await supabase
    .from("peer_connections")
    .select("id, side_a_id, side_a_type, side_b_id, side_b_type, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  type ConnectionRow = {
    id: string;
    side_a_id: string;
    side_a_type: string;
    side_b_id: string;
    side_b_type: string;
    created_at: string | null;
  };

  const connList = (connections ?? []) as ConnectionRow[];

  // Filter to only connections involving the caller
  const filtered = connList.filter(
    (c) =>
      (c.side_a_type === callerType && c.side_a_id === callerId) ||
      (c.side_b_type === callerType && c.side_b_id === callerId)
  );

  // Deduplicate by other side
  const seenOther = new Set<string>();
  const myConnections = filtered.filter((c) => {
    const otherId = c.side_a_id === callerId ? c.side_b_id : c.side_a_id;
    if (seenOther.has(otherId)) return false;
    seenOther.add(otherId);
    return true;
  });

  // Thread IDs per connection
  const connectionThreads: Record<string, string> = {};
  if (myConnections.length > 0) {
    const connIds = myConnections.map((c) => c.id);
    const { data: threads } = await supabase
      .from("chat_threads")
      .select("id, connection_id")
      .in("connection_id", connIds);
    for (const row of threads ?? []) {
      const r = row as { id: string; connection_id: string };
      connectionThreads[r.connection_id] = r.id;
    }
  }

  const pending = pendingReceived.map((p) => ({
    ...p,
    canAccept:
      (p.recipient_type === "organization" && p.recipient_id === orgId) ||
      (p.recipient_type === "user" && p.recipient_id === user.id),
  }));

  // Resolve display info for all other parties
  const orgIds = new Set<string>();
  const userIds = new Set<string>();

  for (const p of pendingReceived) {
    if (p.requester_type === "organization") orgIds.add(p.requester_id);
    else userIds.add(p.requester_id);
  }
  for (const c of myConnections) {
    const otherId = c.side_a_id === callerId ? c.side_b_id : c.side_a_id;
    const otherType = c.side_a_id === callerId ? c.side_b_type : c.side_a_type;
    if (otherType === "organization") orgIds.add(otherId);
    else userIds.add(otherId);
  }

  type OrgProfile = {
    name: string;
    slug: string | null;
    logo_url: string | null;
    profile_image_url: string | null;
  };
  type UserProfile = {
    name: string;
    role: string;
    avatar_url: string | null;
  };

  const orgProfiles: Record<string, OrgProfile> = {};
  const userProfiles: Record<string, UserProfile> = {};

  const [orgRows, userRows] = await Promise.all([
    orgIds.size > 0
      ? supabase
          .from("organizations")
          .select("id, name, slug, logo_url, profile_image_url")
          .in("id", Array.from(orgIds))
      : Promise.resolve({ data: [] }),
    userIds.size > 0
      ? supabase
          .from("user_profiles")
          .select("id, full_name, role")
          .in("id", Array.from(userIds))
      : Promise.resolve({ data: [] }),
  ]);

  for (const row of orgRows.data ?? []) {
    const r = row as {
      id: string;
      name: string;
      slug: string | null;
      logo_url: string | null;
      profile_image_url: string | null;
    };
    orgProfiles[r.id] = {
      name: r.name ?? "Organization",
      slug: r.slug ?? null,
      logo_url: r.logo_url ?? null,
      profile_image_url: r.profile_image_url ?? null,
    };
  }

  for (const row of userRows.data ?? []) {
    const r = row as { id: string; full_name: string | null; role: string };
    userProfiles[r.id] = {
      name: r.full_name ?? "Member",
      role: r.role ?? "member",
      avatar_url: null,
    };
  }

  return (
    <ConnectionsClient
      pendingRequests={pending}
      connections={myConnections}
      connectionThreads={connectionThreads}
      callerId={callerId}
      callerType={callerType}
      orgProfiles={orgProfiles}
      userProfiles={userProfiles}
    />
  );
}
