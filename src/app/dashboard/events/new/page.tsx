import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOrgAdmin } from "@/lib/auth";
import { CreateEventForm } from "./create-event-form";

export default async function NewEventPage() {
  const { organizationId, supabase } = await requireOrgAdmin();

  if (!organizationId) redirect("/dashboard/events");

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, name, eventbrite_org_id")
    .eq("id", organizationId)
    .single();

  const org = orgRow as { id: string; name: string; eventbrite_org_id: string | null } | null;
  if (!org) redirect("/dashboard/events");
  if (!org.eventbrite_org_id) redirect("/dashboard/events");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/events"
          className="text-slate-600 hover:text-slate-900 text-sm"
        >
          ← Back to events
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Create event</h1>
      <CreateEventForm organizationId={organizationId} organizationName={org.name} />
    </div>
  );
}
