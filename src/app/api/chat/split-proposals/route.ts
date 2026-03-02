import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { SPLITS_ENABLED } from "@/lib/feature-flags";

/** POST: Create a split proposal in a chat thread (org-to-org only) */
export async function POST(req: NextRequest) {
  if (!SPLITS_ENABLED) {
    return NextResponse.json({ error: "Split transfers are not available yet" }, { status: 403 });
  }
  try {
    const { supabase, user, profile } = await requireAuth();
    const body = await req.json();
    const { threadId, amountCents, splitPercentages, description } = body as {
      threadId: string;
      amountCents: number;
      splitPercentages?: [number, number];
      description?: string;
    };

    if (!threadId || !amountCents || amountCents < 100) {
      return NextResponse.json({ error: "threadId and amountCents (min 100) required" }, { status: 400 });
    }

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "Organization required for split proposals" }, { status: 400 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id, owner_user_id")
      .eq("id", orgId)
      .single();

    if (!org || (org as { owner_user_id: string }).owner_user_id !== user.id) {
      return NextResponse.json({ error: "Only org owner can propose splits" }, { status: 403 });
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

    const isOrgConnection =
      conn.side_a_type === "organization" && conn.side_b_type === "organization";
    if (!isOrgConnection) {
      return NextResponse.json({ error: "Split proposals are only for organization-to-organization connections" }, { status: 400 });
    }

    const canAccess =
      conn.side_a_id === orgId || conn.side_b_id === orgId;
    if (!canAccess) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const percents = splitPercentages ?? [50, 50];
    const validPercents = Array.isArray(percents) && percents.length === 2
      && percents.every((p) => typeof p === "number" && p >= 0 && p <= 100)
      && Math.abs(percents[0] + percents[1] - 100) < 0.01;

    const { data: inserted, error } = await supabase
      .from("split_proposals")
      .insert({
        thread_id: threadId,
        proposer_org_id: orgId,
        amount_cents: amountCents,
        split_percentages: validPercents ? percents : [50, 50],
        description: description?.trim() || null,
        status: "proposed",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create split proposal" }, { status: 500 });
    }

    return NextResponse.json({ splitProposal: inserted });
  } catch (e) {
    console.error("Split proposal POST error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
