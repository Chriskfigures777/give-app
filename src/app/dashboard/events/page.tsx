import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { OrgEventsClient, type EventRow } from "./org-events-client";

export default async function EventsPage() {
  const { profile, supabase } = await requireAuth();
  const isPlatformAdmin = profile?.role === "platform_admin";
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId && !isPlatformAdmin) {
    redirect("/dashboard");
  }

  const { data: orgRow } = orgId
    ? await supabase
        .from("organizations")
        .select("id, name, eventbrite_org_id")
        .eq("id", orgId)
        .single()
    : { data: null };

  const org = orgRow as {
    id: string;
    name: string;
    eventbrite_org_id: string | null;
  } | null;

  const eventbriteConnected = !!org?.eventbrite_org_id;

  const query = supabase
    .from("events")
    .select(`
      id, slug, name, description, start_at, end_at, online_event, eventbrite_event_id,
      image_url, venue_name, venue_address,
      organizations(name, slug)
    `)
    .order("start_at", { ascending: false })
    .limit(100);

  if (!isPlatformAdmin && orgId) {
    query.eq("organization_id", orgId);
  }

  const { data: eventsData } = await query;
  const events = (eventsData ?? []) as EventRow[];

  const createEventHref = "/dashboard/events/new";
  const connectEventbriteHref = orgId
    ? `/api/eventbrite/connect?organizationId=${orgId}&redirectTo=${encodeURIComponent("/dashboard/events")}`
    : null;

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto overflow-x-hidden">
      <div className="px-4 py-6 space-y-6">
        {!eventbriteConnected && orgId && (
          <div className="dashboard-fade-in rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-800 dark:text-amber-200">
            <p className="font-medium">Connect Eventbrite to create events</p>
            <p className="text-sm mt-1 text-amber-700 dark:text-amber-300">
              Events are synced to Eventbrite for ticketing and RSVPs. Connect your
              organization&apos;s Eventbrite account to get started.
            </p>
          </div>
        )}
        <OrgEventsClient
          initialEvents={events}
          eventbriteConnected={eventbriteConnected}
          createEventHref={createEventHref}
          connectEventbriteHref={connectEventbriteHref}
        />
      </div>
    </div>
  );
}
