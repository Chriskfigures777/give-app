import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { ChatThreadClient } from "./chat-thread-client";

type Props = { params: Promise<{ threadId: string }> };

export default async function ChatThreadPage({ params }: Props) {
  const { threadId } = await params;
  const { supabase, user, profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  const { data: threadData } = await supabase
    .from("chat_threads")
    .select("id, connection_id")
    .eq("id", threadId)
    .single();

  type ThreadRow = { id: string; connection_id: string };
  const thread = threadData as ThreadRow | null;
  if (!thread) notFound();

  const { data: connData } = await supabase
    .from("peer_connections")
    .select("side_a_id, side_a_type, side_b_id, side_b_type")
    .eq("id", thread.connection_id)
    .single();

  type ConnRow = { side_a_id: string; side_a_type: string; side_b_id: string; side_b_type: string };
  const conn = connData as ConnRow | null;
  if (!conn) notFound();

  const canAccess =
    (conn.side_a_type === "user" && conn.side_a_id === user.id) ||
    (conn.side_b_type === "user" && conn.side_b_id === user.id) ||
    (orgId && conn.side_a_type === "organization" && conn.side_a_id === orgId) ||
    (orgId && conn.side_b_type === "organization" && conn.side_b_id === orgId);

  if (!canAccess) notFound();

  const otherIsA = (conn.side_a_type === "user" && conn.side_a_id !== user.id) || (conn.side_a_type === "organization" && conn.side_a_id !== orgId);
  const otherId = otherIsA ? conn.side_a_id : conn.side_b_id;
  const otherType = otherIsA ? conn.side_a_type : conn.side_b_type;

  let otherName = "Unknown";
  if (otherType === "organization") {
    const { data: o } = await supabase.from("organizations").select("name").eq("id", otherId).single();
    otherName = (o as { name: string } | null)?.name ?? "Organization";
  } else {
    const { data: p } = await supabase.from("user_profiles").select("full_name, email").eq("id", otherId).single();
    const pRow = p as { full_name: string | null; email: string | null } | null;
    otherName = pRow?.full_name || pRow?.email || "User";
  }

  const { data: org } = orgId
    ? await supabase.from("organizations").select("id, owner_user_id").eq("id", orgId).single()
    : { data: null };
  const isOrgOwner = org && (org as { owner_user_id: string }).owner_user_id === user.id;

  const otherOrgId = otherType === "organization" ? otherId : null;

  return (
    <ChatThreadClient
      threadId={threadId}
      otherName={otherName}
      orgId={orgId ?? null}
      otherOrgId={otherOrgId}
      isOrgOwner={!!isOrgOwner}
      userId={user.id}
    />
  );
}
