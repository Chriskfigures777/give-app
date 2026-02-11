import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { EventbriteWidget } from "./eventbrite-widget";

type Props = { params: Promise<{ slug: string }> };

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      id, slug, name, description, start_at, end_at,
      venue_name, venue_address, online_event, image_url,
      eventbrite_event_id,
      organizations(name, slug)
    `)
    .eq("slug", slug)
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
    eventbrite_event_id: string | null;
    organizations: { name: string; slug: string } | null;
  };

  const org = ev.organizations;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {ev.image_url && (
            <div className="aspect-video bg-slate-200">
              <img
                src={ev.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-6 sm:p-8">
            {org && (
              <Link
                href={`/give/${org.slug}`}
                className="text-sm text-emerald-600 hover:underline"
              >
                {org.name}
              </Link>
            )}
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              {ev.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
              <span>
                {new Date(ev.start_at).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span>–</span>
              <span>
                {new Date(ev.end_at).toLocaleDateString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              {ev.online_event && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                  Online
                </span>
              )}
            </div>
            {!ev.online_event && (ev.venue_name || ev.venue_address) && (
              <div className="mt-3 text-sm text-slate-600">
                {ev.venue_name && <p className="font-medium">{ev.venue_name}</p>}
                {ev.venue_address && (
                  <p className="text-slate-500">{ev.venue_address}</p>
                )}
              </div>
            )}
            {ev.description && (
              <div className="mt-6 prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">
                {ev.description}
              </div>
            )}
            {ev.eventbrite_event_id && (
              <div className="mt-8">
                <EventbriteWidget eventId={ev.eventbrite_event_id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
