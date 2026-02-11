import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditEventForm } from "./edit-event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, organizationId } = await requireOrgAdmin();

  if (!organizationId) notFound();

  const { data: event, error } = await supabase
    .from("events")
    .select("id, slug, name, description, start_at, end_at, venue_name, venue_address, online_event, image_url")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !event) notFound();

  const ev = event as {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    start_at: string;
    end_at: string;
    venue_name: string | null;
    venue_address: string | null;
    online_event: boolean;
    image_url: string | null;
  };

  const startLocal = new Date(ev.start_at);
  const endLocal = new Date(ev.end_at);
  const startAt =
    startLocal.getFullYear() +
    "-" +
    String(startLocal.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(startLocal.getDate()).padStart(2, "0") +
    "T" +
    String(startLocal.getHours()).padStart(2, "0") +
    ":" +
    String(startLocal.getMinutes()).padStart(2, "0");
  const endAt =
    endLocal.getFullYear() +
    "-" +
    String(endLocal.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(endLocal.getDate()).padStart(2, "0") +
    "T" +
    String(endLocal.getHours()).padStart(2, "0") +
    ":" +
    String(endLocal.getMinutes()).padStart(2, "0");

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const eventUrl = baseUrl ? `${baseUrl}/events/${ev.id}` : `/events/${ev.id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/events"
          className="text-slate-600 hover:text-slate-900 text-sm"
        >
          ← Back to events
        </Link>
        <a
          href={eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View event →
        </a>
      </div>
      <h1 className="text-2xl font-semibold">Edit event</h1>
      <p className="text-sm text-slate-500">
        Changes save to this site. Eventbrite is not updated on edit.
      </p>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Event URL</p>
        <p className="mt-1 text-sm text-slate-900 font-mono break-all">{eventUrl}</p>
      </div>
      <EditEventForm
        eventId={ev.id}
        initial={{
          name: ev.name,
          description: ev.description ?? "",
          startAt,
          endAt,
          venueName: ev.venue_name ?? "",
          venueAddress: ev.venue_address ?? "",
          onlineEvent: ev.online_event,
          imageUrl: ev.image_url ?? "",
        }}
      />
    </div>
  );
}
