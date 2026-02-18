import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export type NotificationItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

/** GET: List notifications for current user */
export async function GET() {
  try {
    const { supabase, user } = await requireAuth();

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, type, payload, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Notifications GET error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const items = (notifications ?? []).map((n) => ({
      id: (n as { id: string }).id,
      type: (n as { type: string }).type,
      payload: (n as { payload: Record<string, unknown> }).payload ?? {},
      read_at: (n as { read_at: string | null }).read_at,
      created_at: (n as { created_at: string }).created_at,
    }));

    const unreadCount = items.filter((i) => !i.read_at).length;

    return NextResponse.json({ notifications: items, unreadCount });
  } catch (e) {
    console.error("Notifications error:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
