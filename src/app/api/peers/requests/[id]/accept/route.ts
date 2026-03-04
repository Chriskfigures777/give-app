import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { createNotification, getOrgOwnerUserId } from "@/lib/notifications";

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
        // Sync user↔user to friends when already connected
        if (sideA.type === "user" && sideB.type === "user") {
          try {
            const { data: pA } = await service.from("user_profiles").select("unit_customer_id, full_name").eq("id", sideA.id).single();
            const { data: pB } = await service.from("user_profiles").select("unit_customer_id, full_name").eq("id", sideB.id).single();
            const nameA = (pA as { full_name?: string } | null)?.full_name ?? null;
            const nameB = (pB as { full_name?: string } | null)?.full_name ?? null;
            const unitA = (pA as { unit_customer_id?: string } | null)?.unit_customer_id ?? null;
            const unitB = (pB as { unit_customer_id?: string } | null)?.unit_customer_id ?? null;
            await (service as unknown as { from: (t: string) => { upsert: (rows: unknown[], opts: { onConflict: string }) => Promise<unknown> } })
              .from("friends")
              .upsert(
                [
                  { user_id: sideA.id, friend_id: sideB.id, unit_customer_id: unitB, display_name: nameB },
                  { user_id: sideB.id, friend_id: sideA.id, unit_customer_id: unitA, display_name: nameA },
                ],
                { onConflict: "user_id,friend_id" }
              );
          } catch {
            // ignore
          }
        }
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

    // Notify the requester org's owner that their connection request was accepted
    if (request.requester_type === "organization") {
      const requesterOwnerUserId = await getOrgOwnerUserId(request.requester_id);
      if (requesterOwnerUserId) {
        const { data: recipientOrgRow } = await supabase
          .from("organizations")
          .select("name, slug")
          .eq("id", request.recipient_id)
          .single();
        const recipientOrg = recipientOrgRow as { name: string; slug: string } | null;
        createNotification({
          userId: requesterOwnerUserId,
          type: "connection_accepted",
          payload: {
            organization_id: request.recipient_id,
            organization_name: recipientOrg?.name ?? "An organization",
            organization_slug: recipientOrg?.slug ?? "",
            thread_id: (thread as { id: string } | null)?.id ?? null,
          },
        }).catch(() => {});
      }
    }

    // Sync user↔user connections to friends table for banking app P2P
    if (sideA.type === "user" && sideB.type === "user") {
      try {
        const { data: pA } = await service.from("user_profiles").select("unit_customer_id, full_name").eq("id", sideA.id).single();
        const { data: pB } = await service.from("user_profiles").select("unit_customer_id, full_name").eq("id", sideB.id).single();
        const unitA = (pA as { unit_customer_id?: string; full_name?: string } | null)?.unit_customer_id;
        const unitB = (pB as { unit_customer_id?: string; full_name?: string } | null)?.unit_customer_id;
        const nameA = (pA as { full_name?: string } | null)?.full_name ?? null;
        const nameB = (pB as { full_name?: string } | null)?.full_name ?? null;

        // Insert both directions (A→B and B→A)
        await (service as unknown as { from: (t: string) => { upsert: (rows: unknown[], opts: { onConflict: string }) => Promise<unknown> } })
          .from("friends")
          .upsert(
            [
              { user_id: sideA.id, friend_id: sideB.id, unit_customer_id: unitB ?? null, display_name: nameB },
              { user_id: sideB.id, friend_id: sideA.id, unit_customer_id: unitA ?? null, display_name: nameA },
            ],
            { onConflict: "user_id,friend_id" }
          );
      } catch (err) {
        console.warn("[accept] friends sync skipped:", err);
      }
    }

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
