import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile } = await requireAuth();
    const { id: originalFeedItemId } = await params;

    if (!originalFeedItemId) {
      return NextResponse.json({ error: "Feed item ID required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const comment = (body?.comment ?? "").trim() || null;

    // Fetch original feed item to get organization_id (share appears under sharer's org or original org)
    const { data: originalItem, error: fetchError } = await supabase
      .from("feed_items")
      .select("id, organization_id")
      .eq("id", originalFeedItemId)
      .single();

    if (fetchError || !originalItem) {
      return NextResponse.json({ error: "Feed item not found" }, { status: 404 });
    }

    const orig = originalItem as { id: string; organization_id: string };

    // Share appears under the original item's org (so it shows in feeds of people who follow that org)
    // The payload records who shared it
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id ?? orig.organization_id;

    const { data: shareItem, error: insertError } = await supabase
      .from("feed_items")
      .insert({
        item_type: "share",
        organization_id: orgId,
        author_id: user.id,
        author_type: "user",
        payload: {
          original_feed_item_id: originalFeedItemId,
          shared_by_user_id: user.id,
          shared_by_org_id: profile?.organization_id ?? null,
          comment,
          shared_by_name: profile?.full_name ?? "Someone",
        },
      })
      .select("id, item_type, organization_id, payload, created_at")
      .single();

    if (insertError) {
      console.error("Share insert error:", insertError);
      return NextResponse.json({ error: "Failed to share" }, { status: 500 });
    }

    return NextResponse.json({ share: shareItem });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
