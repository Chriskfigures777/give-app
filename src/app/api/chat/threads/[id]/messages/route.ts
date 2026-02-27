import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { createMessageNotification, getOrgOwnerUserId } from "@/lib/notifications";

/** GET: List messages in a thread */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile } = await requireAuth();
    const { id: threadId } = await params;

    const { data: threadData } = await supabase
      .from("chat_threads")
      .select("id, connection_id")
      .eq("id", threadId)
      .single();

    const thread = threadData as { id: string; connection_id: string } | null;
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const { data: connData } = await supabase
      .from("peer_connections")
      .select("side_a_id, side_a_type, side_b_id, side_b_type")
      .eq("id", thread.connection_id)
      .single();

    const conn = connData as { side_a_id: string; side_a_type: string; side_b_id: string; side_b_type: string } | null;
    if (!conn) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    const canAccess =
      (conn.side_a_type === "user" && conn.side_a_id === user.id) ||
      (conn.side_b_type === "user" && conn.side_b_id === user.id) ||
      (orgId && conn.side_a_type === "organization" && conn.side_a_id === orgId) ||
      (orgId && conn.side_b_type === "organization" && conn.side_b_id === orgId);

    if (!canAccess) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { data: messages } = await supabase
      .from("chat_messages")
      .select("id, sender_id, sender_type, content, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    return NextResponse.json({ messages: messages ?? [] });
  } catch (e) {
    console.error("Messages GET error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** POST: Send a message */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile } = await requireAuth();
    const { id: threadId } = await params;
    const body = await req.json();
    const { content, senderType = "user" } = body as { content: string; senderType?: "user" | "organization" };

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const { data: threadData } = await supabase
      .from("chat_threads")
      .select("id, connection_id")
      .eq("id", threadId)
      .single();

    const thread = threadData as { id: string; connection_id: string } | null;
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const { data: connData } = await supabase
      .from("peer_connections")
      .select("side_a_id, side_a_type, side_b_id, side_b_type")
      .eq("id", thread.connection_id)
      .single();

    const conn = connData as { side_a_id: string; side_a_type: string; side_b_id: string; side_b_type: string } | null;
    if (!conn) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    const canAccess =
      (conn.side_a_type === "user" && conn.side_a_id === user.id) ||
      (conn.side_b_type === "user" && conn.side_b_id === user.id) ||
      (orgId && conn.side_a_type === "organization" && conn.side_a_id === orgId) ||
      (orgId && conn.side_b_type === "organization" && conn.side_b_id === orgId);

    if (!canAccess) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const senderId = senderType === "organization" ? orgId : user.id;
    if (!senderId) {
      return NextResponse.json({ error: "No sender identity" }, { status: 400 });
    }

    const { data: inserted, error } = await supabase
      .from("chat_messages")
      // @ts-ignore - chat_messages Insert type
      .insert({
        thread_id: threadId,
        sender_id: senderId,
        sender_type: senderType,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    // Notify the other party about the new message (fire-and-forget)
    const otherSide =
      (conn.side_a_type === senderType && conn.side_a_id === senderId)
        ? { id: conn.side_b_id, type: conn.side_b_type }
        : { id: conn.side_a_id, type: conn.side_a_type };

    let recipientUserId: string | null = null;
    if (otherSide.type === "user") {
      recipientUserId = otherSide.id;
    } else if (otherSide.type === "organization") {
      recipientUserId = await getOrgOwnerUserId(otherSide.id);
    }

    if (recipientUserId) {
      // Determine a display name for the sender
      let senderDisplayName = "Someone";
      if (senderType === "organization" && orgId) {
        const { data: senderOrg } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single();
        senderDisplayName = (senderOrg as { name: string } | null)?.name ?? "An organization";
      } else {
        senderDisplayName = profile?.full_name ?? user.email ?? "Someone";
      }

      createMessageNotification({
        recipientUserId,
        threadId,
        senderName: senderDisplayName,
        contentPreview: content.trim(),
      }).catch(() => {});
    }

    return NextResponse.json({ message: inserted });
  } catch (e) {
    console.error("Messages POST error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
