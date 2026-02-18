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

  const upcomingCount = events.filter((e) => new Date(e.start_at) >= new Date()).length;
  const pastCount = events.length - upcomingCount;

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="dashboard-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Events</h1>
          <p className="mt-1 text-slate-600">Manage your events and sync with Eventbrite.</p>
        </div>
        {orgId && (
          <div className="flex gap-2">
            {eventbriteConnected ? (
              <Link href="/dashboard/events/new">
                <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
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
        <div className="dashboard-fade-in dashboard-fade-in-delay-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Connect Eventbrite to create events</p>
          <p className="text-sm mt-1 text-amber-700">
            Events are synced to Eventbrite for ticketing and RSVPs. Click the button above to connect your organization&apos;s Eventbrite account.
          </p>
        </div>
      )}

      {/* Summary cards */}
      {events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="dashboard-fade-in dashboard-fade-in-delay-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total events</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{events.length}</p>
              </div>
              <div className="rounded-xl bg-violet-500/10 p-2.5">
                <Calendar className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </div>
          <div className="dashboard-fade-in dashboard-fade-in-delay-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Upcoming</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{upcomingCount}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="dashboard-fade-in dashboard-fade-in-delay-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Past</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{pastCount}</p>
              </div>
              <div className="rounded-xl bg-slate-500/10 p-2.5">
                <Calendar className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm ${events.length > 0 ? "dashboard-fade-in dashboard-fade-in-delay-4" : "dashboard-fade-in dashboard-fade-in-delay-1"}`}>
        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No events yet.</p>
            {eventbriteConnected && (
              <Link href="/dashboard/events/new">
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                  Create your first event
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200/80 px-5 py-4">
              <h2 className="text-base font-bold text-slate-900">Event list</h2>
            </div>
            <ul className="divide-y divide-slate-200">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/50"
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
          </>
        )}
      </div>
    </div>
  );
}
