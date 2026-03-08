import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { crmFrom } from "@/lib/crm/db";
import { ContactDetailClient } from "./contact-detail-client";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const [
    { data: contact, error },
    { data: allTagsData },
    { data: contactTagsData },
    { data: surveysData },
  ] = await Promise.all([
    supabase
      .from("organization_contacts")
      .select("id, email, name, phone, source, sources_breakdown, first_seen_at, last_seen_at")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single(),
    crmFrom(supabase, "crm_tags")
      .select("id, name, color")
      .eq("organization_id", orgId)
      .order("name"),
    crmFrom(supabase, "crm_contact_tags")
      .select("id, assigned_at, crm_tags(id, name, color)")
      .eq("contact_id", id),
    supabase
      .from("organization_surveys")
      .select("id, title, status")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  if (error || !contact) notFound();

  const allTags = ((allTagsData ?? []) as unknown) as Array<{ id: string; name: string; color: string }>;

  const initialContactTags = ((contactTagsData ?? []) as unknown as Array<{
    id: string;
    assigned_at: string;
    crm_tags: { id: string; name: string; color: string } | null;
  }>).map((row) => {
    const tag = (row as {
      id: string;
      assigned_at: string;
      crm_tags: { id: string; name: string; color: string } | null;
    });
    return {
      assignmentId: tag.id,
      assignedAt: tag.assigned_at,
      ...(tag.crm_tags ?? { id: "", name: "", color: "" }),
    };
  }).filter((t) => t.id);

  const surveys = (surveysData ?? []) as Array<{ id: string; title: string; status: string }>;

  const c = contact as {
    id: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    source: string;
    sources_breakdown: Record<string, number>;
    first_seen_at: string;
    last_seen_at: string;
  };

  return (
    <ContactDetailClient
      contact={c}
      allTags={allTags}
      initialContactTags={initialContactTags}
      surveys={surveys}
    />
  );
}
