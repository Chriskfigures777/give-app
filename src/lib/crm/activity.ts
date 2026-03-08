/**
 * CRM Activity Logger — writes to crm_activity_log.
 * Always call from server-side API routes (never from client).
 * Failures are swallowed so they never break primary flows.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type CrmEventType =
  | "contact_created"
  | "note_added"
  | "note_edited"
  | "note_deleted"
  | "tag_added"
  | "tag_removed"
  | "message_sent"
  | "broadcast_received"
  | "survey_sent"
  | "survey_responded";

export async function logActivity(
  supabase: SupabaseClient,
  params: {
    contactId: string;
    organizationId: string;
    eventType: CrmEventType;
    eventData?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await supabase.from("crm_activity_log").insert({
      contact_id: params.contactId,
      organization_id: params.organizationId,
      event_type: params.eventType,
      event_data: params.eventData ?? {},
    });
  } catch (err) {
    console.error("[crm/activity] log failed:", err);
  }
}
