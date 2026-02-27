import { createServiceClient } from "@/lib/supabase/server";

/**
 * Insert a notification row using the service-role client (bypasses RLS).
 * Always fire-and-forget — errors are logged but never thrown so callers
 * are never blocked by a notification failure.
 */
export async function createNotification({
  userId,
  type,
  payload,
}: {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("notifications")
      // @ts-ignore - notifications Insert type may be narrow in generated types
      .insert({ user_id: userId, type, payload });
    if (error) {
      console.error(`[notifications] Failed to create "${type}":`, error);
    }
  } catch (e) {
    console.error(`[notifications] Unexpected error creating "${type}":`, e);
  }
}

/**
 * Look up an organization's owner user ID.
 * Returns null if not found.
 */
export async function getOrgOwnerUserId(orgId: string): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("organizations")
      .select("owner_user_id")
      .eq("id", orgId)
      .single();
    return (data as { owner_user_id: string | null } | null)?.owner_user_id ?? null;
  } catch {
    return null;
  }
}

/**
 * Create a message_received notification, but only if there is no existing
 * unread message_received notification for the same thread+recipient.
 * This prevents notification spam when many messages are sent in a row.
 */
export async function createMessageNotification({
  recipientUserId,
  threadId,
  senderName,
  contentPreview,
}: {
  recipientUserId: string;
  threadId: string;
  senderName: string;
  contentPreview: string;
}): Promise<void> {
  try {
    const supabase = createServiceClient();

    // Avoid spamming: only one unread message notification per thread per user.
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", recipientUserId)
      .eq("type", "message_received")
      // @ts-ignore - contains works at runtime even if types are strict
      .contains("payload", { thread_id: threadId })
      .is("read_at", null);

    if ((count ?? 0) > 0) return;

    await createNotification({
      userId: recipientUserId,
      type: "message_received",
      payload: {
        thread_id: threadId,
        sender_name: senderName,
        content_preview: contentPreview.slice(0, 120),
      },
    });
  } catch (e) {
    console.error("[notifications] createMessageNotification error:", e);
  }
}
