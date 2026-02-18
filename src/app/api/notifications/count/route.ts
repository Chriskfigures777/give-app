import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** GET: Unread notification count for badge */
export async function GET() {
  try {
    const { supabase, user } = await requireAuth();

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("type", "connection_request")
      .is("read_at", null);

    if (error) {
      return NextResponse.json({ unreadCount: 0 });
    }

    return NextResponse.json({ unreadCount: count ?? 0 });
  } catch {
    return NextResponse.json({ unreadCount: 0 });
  }
}
