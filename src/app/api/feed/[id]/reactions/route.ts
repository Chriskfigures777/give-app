import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await requireAuth();
    const { id: feedItemId } = await params;

    if (!feedItemId) {
      return NextResponse.json({ error: "Feed item ID required" }, { status: 400 });
    }

    // Check if user already reacted
    const { data: existing } = await supabase
      .from("feed_item_reactions")
      .select("id")
      .eq("feed_item_id", feedItemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Toggle: remove reaction
      const { error: delError } = await supabase
        .from("feed_item_reactions")
        .delete()
        .eq("feed_item_id", feedItemId)
        .eq("user_id", user.id);

      if (delError) {
        console.error("Reaction delete error:", delError);
        return NextResponse.json({ error: "Failed to remove support" }, { status: 500 });
      }

      return NextResponse.json({ supported: false, action: "removed" });
    }

    // Add reaction
    const { error: insertError } = await supabase.from("feed_item_reactions").insert({
      feed_item_id: feedItemId,
      user_id: user.id,
      reaction_type: "support",
    });

    if (insertError) {
      console.error("Reaction insert error:", insertError);
      return NextResponse.json({ error: "Failed to add support" }, { status: 500 });
    }

    return NextResponse.json({ supported: true, action: "added" });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
