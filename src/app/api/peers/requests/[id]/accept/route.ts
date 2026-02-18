import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/** POST: Accept a peer request */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, profile } = await requireAuth();
    const { id } = await params;

    const supabase = await createClient();
    const { data: requestData } = await supabase
      .from("peer_requests")
      .select("id, requester_id, requester_type, recipient_id, recipient_type, status")
      .eq("id", id)
      .single();

    const request = requestData as { id: string; requester_id: string; requester_type: string; recipient_id: string; recipient_type: string; status: string } | null;
    if (!request || request.status !== "pending") {
      return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
    }

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    let isRecipient =
      (request.recipient_type === "user" && request.recipient_id === user.id) ||
      (request.recipient_type === "organization" && request.recipient_id === orgId);

    if (!isRecipient && request.recipient_type === "organization") {
      const { data: recipientOrg } = await supabase
        .from("organizations")
        .select("owner_user_id")
        .eq("id", request.recipient_id)
        .single();
      const ownerId = (recipientOrg as { owner_user_id: string | null } | null)?.owner_user_id;
      if (ownerId === user.id) isRecipient = true;
    }

    if (!isRecipient) {
      return NextResponse.json({ error: "Not authorized to accept" }, { status: 403 });
    }

    const sideA = { id: request.requester_id, type: request.requester_type };
    const sideB = { id: request.recipient_id, type: request.recipient_type };

    const service = createServiceClient();
    const { data: connData, error: connError } = await service
      .from("peer_connections")
      // @ts-ignore - peer_connections Insert type
      .insert({
        side_a_id: sideA.id,
        side_a_type: sideA.type,
        side_b_id: sideB.id,
        side_b_type: sideB.type,
      })
      .select("id")
      .single();

    if (connError) {
      if (connError.code === "23505") {
        const { data: existing } = await service
          .from("peer_connections")
          .select("id")
          .eq("side_a_id", sideA.id)
          .eq("side_a_type", sideA.type)
          .eq("side_b_id", sideB.id)
          .eq("side_b_type", sideB.type)
          .single();
        // @ts-ignore - peer_requests Update type
        await service.from("peer_requests").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", id);
        const connectionId = (existing as { id: string } | null)?.id ?? "";
        const { data: existingThread } = await service
          .from("chat_threads")
          .select("id")
          .eq("connection_id", connectionId)
          .single();
        return NextResponse.json({ success: true, alreadyConnected: true, connectionId, threadId: (existingThread as { id: string } | null)?.id });
      }
      return NextResponse.json(
        { error: "Failed to create connection", details: connError.code },
        { status: 500 }
      );
    }

    // @ts-ignore - peer_requests Update type
    await service.from("peer_requests").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", id);

    const connectionId = (connData as { id: string })?.id;

    const { data: thread } = await service
      .from("chat_threads")
      // @ts-ignore - chat_threads Insert type
      .insert({ connection_id: connectionId })
      .select("id")
      .single();

    return NextResponse.json({ success: true, connectionId, threadId: (thread as { id: string } | null)?.id });
  } catch (e) {
    console.error("Accept peer request error", e);
    const message = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json(
      { error: message },
      { status: message.includes("service") ? 500 : 401 }
    );
  }
}
