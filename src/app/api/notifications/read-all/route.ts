import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** POST: Mark all notifications as read */
export async function POST() {
  try {
    const { supabase, user } = await requireAuth();

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error("Notifications read-all error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Notifications read-all error:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
