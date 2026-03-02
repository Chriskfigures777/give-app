import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/** POST: Decline a peer request */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile } = await requireAuth();
    const { id } = await params;

    const { data: requestData } = await supabase
      .from("peer_requests")
      .select("id, recipient_id, recipient_type, status")
      .eq("id", id)
      .single();

    const request = requestData as { id: string; recipient_id: string; recipient_type: string; status: string } | null;
    if (!request || request.status !== "pending") {
      return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
    }

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    const isRecipient =
      (request.recipient_type === "user" && request.recipient_id === user.id) ||
      (request.recipient_type === "organization" && request.recipient_id === orgId);

    if (!isRecipient) {
      return NextResponse.json({ error: "Not authorized to decline" }, { status: 403 });
    }

    // @ts-ignore - peer_requests Update type
    await supabase.from("peer_requests").update({ status: "declined", updated_at: new Date().toISOString() }).eq("id", id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Decline peer request error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
