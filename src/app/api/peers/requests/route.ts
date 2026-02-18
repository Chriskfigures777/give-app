import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

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

/** POST: Create a peer request (org-to-org only) */
export async function POST(req: NextRequest) {
  try {
    const { supabase, profile } = await requireAuth();
    const body = await req.json();
    const { recipientId, message } = body as {
      recipientId: string;
      message?: string;
    };

    if (!recipientId) {
      return NextResponse.json({ error: "recipientId required" }, { status: 400 });
    }

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "You need an organization to connect. Create or join an organization first." }, { status: 400 });
    }

    if (recipientId === orgId) {
      return NextResponse.json({ error: "You cannot send a connection request to your own organization." }, { status: 400 });
    }

    const requesterId = orgId;
    const requesterType = "organization";
    const recipientType = "organization";

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
        requester_type: "organization",
        recipient_id: recipientId,
        recipient_type: "organization",
        status: "pending",
        message: message?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    return NextResponse.json({ peerRequest: inserted });
  } catch (e) {
    console.error("Peer requests POST error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
