import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { crmFrom } from "@/lib/crm/db";
import { PeoplePageClient } from "./people-page-client";

type ContactRow = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  source: string;
  sources_breakdown: Record<string, number>;
  first_seen_at: string;
  last_seen_at: string;
};

type CrmTag = { id: string; name: string; color: string };

export default async function PeoplePage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  // 30-day window for engagement scoring
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: contactsData },
    { data: tagsData },
    { data: responsesData },
  ] = await Promise.all([
    supabase
      .from("organization_contacts")
      .select("id, email, name, phone, source, sources_breakdown, first_seen_at, last_seen_at")
      .eq("organization_id", orgId)
      .order("last_seen_at", { ascending: false }),
    crmFrom(supabase, "crm_tags")
      .select("id, name, color")
      .eq("organization_id", orgId)
      .order("name"),
    // Fetch survey responses in last 30 days — we'll count per respondent_email
    supabase
      .from("organization_survey_responses")
      .select("respondent_email, contact_id")
      .eq("organization_id", orgId)
      .gte("created_at", since),
  ]);

  const contacts = (contactsData ?? []) as ContactRow[];
  const initialTags = ((tagsData ?? []) as unknown) as CrmTag[];

  // Build a map: email (lowercase) -> response count in last 30 days
  const surveyResponseCounts: Record<string, number> = {};
  for (const r of (responsesData ?? [])) {
    const key = (r as { respondent_email?: string | null; contact_id?: string | null }).respondent_email?.toLowerCase().trim();
    if (key) {
      surveyResponseCounts[key] = (surveyResponseCounts[key] ?? 0) + 1;
    }
  }

  return (
    <PeoplePageClient
      contacts={contacts}
      initialTags={initialTags}
      surveyResponseCounts={surveyResponseCounts}
    />
  );
}
