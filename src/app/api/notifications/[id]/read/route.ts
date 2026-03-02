import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** POST: Mark a notification as read */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await requireAuth();
    const { id } = await params;

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Notification read error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Notification read error:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
