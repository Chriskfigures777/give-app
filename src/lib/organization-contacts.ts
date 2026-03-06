/**
 * Upsert organization contact (CRM). Used when a donation succeeds, a form is submitted, or a survey response is recorded.
 * One row per (organization_id, email). Updates last_seen_at and merges sources_breakdown.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type ContactSource = "donation" | "form" | "survey";

/** When source is "form", optional form kind for CRM label (e.g. "member", "get_started"). */
export type FormKind = "member" | "get_started" | null;

export async function upsertOrganizationContact(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    email: string | null;
    name?: string | null;
    phone?: string | null;
    source: ContactSource;
    userId?: string | null;
    /** When source is "form", store so CRM can show "Member" or "Get started". */
    formKind?: FormKind;
  }
): Promise<void> {
  const { organizationId, email, name, phone, source, userId, formKind } = params;
  const now = new Date().toISOString();

  if (!email || !email.trim()) {
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("organization_contacts")
    .select("id, sources_breakdown, first_seen_at")
    .eq("organization_id", organizationId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  const breakdown = (existing?.sources_breakdown as Record<string, number> | null) ?? {};
  const count = typeof breakdown[source] === "number" ? breakdown[source] + 1 : 1;
  const newBreakdown = { ...breakdown, [source]: count };
  if (source === "form" && formKind && (formKind === "member" || formKind === "get_started")) {
    const kindCount = typeof newBreakdown[formKind] === "number" ? newBreakdown[formKind] + 1 : 1;
    newBreakdown[formKind] = kindCount;
  }

  if (existing) {
    await supabase
      .from("organization_contacts")
      .update({
        name: name ?? undefined,
        phone: phone ?? undefined,
        user_id: userId ?? undefined,
        source,
        sources_breakdown: newBreakdown,
        last_seen_at: now,
        updated_at: now,
      })
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("organization_contacts").insert({
      organization_id: organizationId,
      email: normalizedEmail,
      name: name ?? null,
      phone: phone ?? null,
      user_id: userId ?? null,
      source,
      sources_breakdown: newBreakdown,
      first_seen_at: now,
      last_seen_at: now,
    });
  }
}
