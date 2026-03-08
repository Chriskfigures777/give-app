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

  const [{ data: contactsData }, { data: tagsData }] = await Promise.all([
    supabase
      .from("organization_contacts")
      .select("id, email, name, phone, source, sources_breakdown, first_seen_at, last_seen_at")
      .eq("organization_id", orgId)
      .order("last_seen_at", { ascending: false }),
    crmFrom(supabase, "crm_tags")
      .select("id, name, color")
      .eq("organization_id", orgId)
      .order("name"),
  ]);

  const contacts = (contactsData ?? []) as ContactRow[];
  const initialTags = ((tagsData ?? []) as unknown) as CrmTag[];

  return <PeoplePageClient contacts={contacts} initialTags={initialTags} />;
}
