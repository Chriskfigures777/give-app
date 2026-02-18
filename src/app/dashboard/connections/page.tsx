import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { ConnectionsClient } from "./connections-client";

/** Connections: org-to-org only. Requires an organization. */
export default async function ConnectionsPage() {
  const { supabase, user, profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) {
    redirect("/dashboard?org=required");
  }

  const { data: toOrg } = await supabase
    .from("peer_requests")
    .select("id, requester_id, requester_type, recipient_id, recipient_type, message, created_at")
    .eq("recipient_id", orgId)
    .eq("recipient_type", "organization")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  const pendingReceived = (toOrg ?? []) as {
    id: string;
    requester_id: string;
    requester_type: string;
    recipient_id: string;
    recipient_type: string;
    message: string | null;
    created_at: string;
  }[];

  const { data: connections } = await supabase
    .from("peer_connections")
    .select("id, side_a_id, side_a_type, side_b_id, side_b_type, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  type ConnectionRow = { id: string; side_a_id: string; side_a_type: string; side_b_id: string; side_b_type: string; created_at: string | null };
  const connList = (connections ?? []) as ConnectionRow[];
  const filtered = connList.filter(
    (c) =>
      (c.side_a_type === "organization" && c.side_a_id === orgId) ||
      (c.side_b_type === "organization" && c.side_b_id === orgId)
  );
  const seenOther = new Set<string>();
  const myConnections = filtered.filter((c) => {
    const otherId = c.side_a_id === orgId ? c.side_b_id : c.side_a_id;
    if (seenOther.has(otherId)) return false;
    seenOther.add(otherId);
    return true;
  });

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
    canAccept: p.recipient_type === "organization" && p.recipient_id === orgId,
  }));

  const orgIds = new Set<string>();
  for (const p of pendingReceived) orgIds.add(p.requester_id);
  for (const c of myConnections) {
    const otherId = c.side_a_id === orgId ? c.side_b_id : c.side_a_id;
    orgIds.add(otherId);
  }
  const orgNames: Record<string, string> = {};
  const orgProfiles: Record<
    string,
    { name: string; slug: string | null; logo_url: string | null; profile_image_url: string | null }
  > = {};
  if (orgIds.size > 0) {
    const { data: orgRows } = await supabase
      .from("organizations")
      .select("id, name, slug, logo_url, profile_image_url")
      .in("id", Array.from(orgIds));
    for (const row of orgRows ?? []) {
      const r = row as { id: string; name: string; slug: string | null; logo_url: string | null; profile_image_url: string | null };
      orgNames[r.id] = r.name ?? "Organization";
      orgProfiles[r.id] = {
        name: r.name ?? "Organization",
        slug: r.slug ?? null,
        logo_url: r.logo_url ?? null,
        profile_image_url: r.profile_image_url ?? null,
      };
    }
  }
  for (const id of orgIds) {
    if (!orgNames[id]) orgNames[id] = "Organization";
    if (!orgProfiles[id]) orgProfiles[id] = { name: "Organization", slug: null, logo_url: null, profile_image_url: null };
  }

  return (
    <ConnectionsClient
      pendingRequests={pending}
      connections={myConnections}
      connectionThreads={connectionThreads}
      orgId={orgId}
      orgNames={orgNames}
      orgProfiles={orgProfiles}
    />
  );
}
