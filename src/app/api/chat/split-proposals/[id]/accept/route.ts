import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { SPLITS_ENABLED } from "@/lib/feature-flags";

/** POST: Accept a split proposal (both proposer and recipient must accept) */
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
      .select("side_a_id, side_a_type, side_b_id, side_b_type")
      .eq("id", thread.connection_id)
      .single();

    const conn = connData as { side_a_id: string; side_a_type: string; side_b_id: string; side_b_type: string } | null;
    if (!conn || conn.side_a_type !== "organization" || conn.side_b_type !== "organization") {
      return NextResponse.json({ error: "Invalid connection" }, { status: 400 });
    }

    const recipientOrgId = conn.side_a_id === proposal.proposer_org_id ? conn.side_b_id : conn.side_a_id;
    const isProposer = proposal.proposer_org_id === orgId;
    const isRecipient = recipientOrgId === orgId;

    if (!isProposer && !isRecipient) {
      return NextResponse.json({ error: "Not authorized to accept this proposal" }, { status: 403 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("owner_user_id")
      .eq("id", orgId)
      .single();

    if (!org || (org as { owner_user_id: string }).owner_user_id !== user.id) {
      return NextResponse.json({ error: "Only org owner can accept" }, { status: 403 });
    }

    const { data: current } = await supabase
      .from("split_proposals")
      .select("proposer_accepted_at, recipient_accepted_at")
      .eq("id", id)
      .single();

    const row = current as { proposer_accepted_at: string | null; recipient_accepted_at: string | null } | null;
    if (!row) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (isProposer) {
      if (row.proposer_accepted_at) {
        return NextResponse.json({ success: true, message: "Already accepted" });
      }
    } else {
      if (row.recipient_accepted_at) {
        return NextResponse.json({ success: true, message: "Already accepted" });
      }
    }

    const update = isProposer
      ? { updated_at: now, proposer_accepted_at: now }
      : { updated_at: now, recipient_accepted_at: now };

    const { data: updated, error: updateError } = await supabase
      .from("split_proposals")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Failed to accept" }, { status: 500 });
    }

    const updatedRow = updated as { proposer_accepted_at: string | null; recipient_accepted_at: string | null };
    const bothAccepted = updatedRow.proposer_accepted_at && updatedRow.recipient_accepted_at;

    if (bothAccepted) {
      await supabase
        .from("split_proposals")
        .update({ status: "mutually_agreed", updated_at: now })
        .eq("id", id);
    }

    return NextResponse.json({
      success: true,
      mutuallyAgreed: bothAccepted,
      splitProposal: updated,
    });
  } catch (e) {
    console.error("Split proposal accept error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
