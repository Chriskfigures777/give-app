import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createNotification, getOrgOwnerUserId } from "@/lib/notifications";

/** GET: List peer requests (as requester or recipient) */
export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending | accepted | declined

    let query = supabase
      .from("peer_requests")
      .select("id, requester_id, requester_type, recipient_id, recipient_type, status, message, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to list requests" }, { status: 500 });
    }

    return NextResponse.json({ peerRequests: data ?? [] });
  } catch (e) {
    console.error("Peer requests GET error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** POST: Create a peer request (org-to-org, user-to-user, or user-to-org) */
export async function POST(req: NextRequest) {
  try {
    const { supabase, profile, user } = await requireAuth();
    const body = await req.json();
    const { recipientId, recipientType: bodyRecipientType, message } = body as {
      recipientId: string;
      recipientType?: string;
      message?: string;
    };

    if (!recipientId) {
      return NextResponse.json({ error: "recipientId required" }, { status: 400 });
    }

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    // Determine requester identity: prefer org, fall back to user
    let requesterId: string;
    let requesterType: string;

    if (orgId) {
      requesterId = orgId;
      requesterType = "organization";
    } else {
      requesterId = user.id;
      requesterType = "user";
    }

    // Determine recipient type: if not provided, infer from whether recipientId looks like an org
    // The client always sends recipientType now
    const recipientType = bodyRecipientType ?? "organization";

    // Prevent self-connection
    if (requesterId === recipientId && requesterType === recipientType) {
      return NextResponse.json({ error: "Cannot send a connection request to yourself." }, { status: 400 });
    }

    // Check for duplicate pending request
    const { data: existing } = await supabase
      .from("peer_requests")
      .select("id")
      .eq("requester_id", requesterId)
      .eq("requester_type", requesterType)
      .eq("recipient_id", recipientId)
      .eq("recipient_type", recipientType)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Request already sent" }, { status: 400 });
    }

    const { data: inserted, error } = await supabase
      .from("peer_requests")
      // @ts-ignore - peer_requests Insert type
      .insert({
        requester_id: requesterId,
        requester_type: requesterType,
        recipient_id: recipientId,
        recipient_type: recipientType,
        status: "pending",
        message: message?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    // Notify the recipient about the incoming connection request
    let notifyUserId: string | null = null;
    if (recipientType === "organization") {
      notifyUserId = await getOrgOwnerUserId(recipientId);
    } else {
      // recipient is a user — notify them directly
      notifyUserId = recipientId;
    }

    if (notifyUserId) {
      // Get requester display name
      let requesterName = "Someone";
      let requesterSlug: string | null = null;

      if (requesterType === "organization") {
        const { data: requesterOrg } = await supabase
          .from("organizations")
          .select("name, slug")
          .eq("id", requesterId)
          .single();
        if (requesterOrg) {
          const ro = requesterOrg as { name: string; slug: string };
          requesterName = ro.name;
          requesterSlug = ro.slug;
        }
      } else {
        const { data: requesterUser } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("id", requesterId)
          .single();
        if (requesterUser) {
          const ru = requesterUser as { full_name: string | null };
          requesterName = ru.full_name ?? "A member";
        }
      }

      createNotification({
        userId: notifyUserId,
        type: "connection_request",
        payload: {
          request_id: (inserted as { id: string }).id,
          requester_id: requesterId,
          requester_type: requesterType,
          organization_id: requesterType === "organization" ? requesterId : null,
          organization_name: requesterName,
          organization_slug: requesterSlug ?? "",
        },
      }).catch(() => {});
    }

    return NextResponse.json({ peerRequest: inserted });
  } catch (e) {
    console.error("Peer requests POST error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
