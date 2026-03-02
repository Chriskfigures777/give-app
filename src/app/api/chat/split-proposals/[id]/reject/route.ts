import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { SPLITS_ENABLED } from "@/lib/feature-flags";

/** POST: Reject a split proposal */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!SPLITS_ENABLED) {
    return NextResponse.json({ error: "Split transfers are not available yet" }, { status: 403 });
  }
  try {
    const { supabase, user, profile } = await requireAuth();
    const { id } = await params;

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const { data: prop } = await supabase
      .from("split_proposals")
      .select("id, thread_id, proposer_org_id, status")
      .eq("id", id)
      .single();

    const proposal = prop as { id: string; thread_id: string; proposer_org_id: string; status: string } | null;
    if (!proposal || proposal.status !== "proposed") {
      return NextResponse.json({ error: "Proposal not found or already processed" }, { status: 404 });
    }

    const { data: threadData } = await supabase
      .from("chat_threads")
      .select("connection_id")
      .eq("id", proposal.thread_id)
      .single();

    const thread = threadData as { connection_id: string } | null;
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const { data: connData } = await supabase
      .from("peer_connections")
      .select("side_a_id, side_b_id")
      .eq("id", thread.connection_id)
      .single();

    const conn = connData as { side_a_id: string; side_b_id: string } | null;
    if (!conn) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const canReject = conn.side_a_id === orgId || conn.side_b_id === orgId;
    if (!canReject) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("owner_user_id")
      .eq("id", orgId)
      .single();

    if (!org || (org as { owner_user_id: string }).owner_user_id !== user.id) {
      return NextResponse.json({ error: "Only org owner can reject" }, { status: 403 });
    }

    const { error } = await supabase
      .from("split_proposals")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Split proposal reject error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
