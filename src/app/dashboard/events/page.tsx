import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, ExternalLink } from "lucide-react";

type EventRow = {
  id: string;
  slug: string;
  name: string;
  start_at: string;
  end_at: string;
  online_event: boolean;
  eventbrite_event_id: string | null;
  organizations: { name: string; slug: string } | null;
};

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
      id, slug, name, start_at, end_at, online_event, eventbrite_event_id,
      organizations(name, slug)
    `)
    .order("start_at", { ascending: false })
    .limit(100);

  if (!isPlatformAdmin && orgId) {
    query.eq("organization_id", orgId);
  }

  const { data: eventsData } = await query;
  const events = (eventsData ?? []) as EventRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Events</h1>
        {orgId && (
          <div className="flex gap-2">
            {eventbriteConnected ? (
              <Link href="/dashboard/events/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create event
                </Button>
              </Link>
            ) : (
              <Link
                href={`/api/eventbrite/connect?organizationId=${orgId}&redirectTo=${encodeURIComponent("/dashboard/events")}`}
              >
                <Button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700">
                  <Calendar className="h-4 w-4" />
                  Connect Eventbrite
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {!eventbriteConnected && orgId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Connect Eventbrite to create events</p>
          <p className="text-sm mt-1 text-amber-700">
            Events are synced to Eventbrite for ticketing and RSVPs. Click the button above to connect your organization&apos;s Eventbrite account.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p>No events yet.</p>
            {eventbriteConnected && (
              <Link href="/dashboard/events/new">
                <Button variant="outline" className="mt-4">
                  Create your first event
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 hover:bg-slate-50/50"
              >
                <div>
                  <p className="font-medium text-slate-900">{e.name}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(e.start_at).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {e.online_event && (
                      <span className="ml-2 text-slate-400">· Online</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/events/${e.id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <ExternalLink className="h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/events/${e.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
