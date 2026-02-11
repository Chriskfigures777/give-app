import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { EventHero } from "./event-hero";
import { EventDetailsSection } from "./event-details-section";
import { EventRegistrationSection } from "./event-registration-section";
import { SiteFooter } from "@/components/site-footer";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("name, description")
    .eq("id", id)
    .single();

  if (!event) {
    return { title: "Event not found" };
  }

  const ev = event as { name: string; description: string | null };
  return {
    title: `${ev.name} — Give`,
    description: ev.description?.slice(0, 160) ?? `Join us for ${ev.name}`,
  };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      id, slug, name, description, start_at, end_at,
      venue_name, venue_address, online_event, image_url,
      eventbrite_event_id,
      organizations(name, slug)
    `)
    .eq("id", id)
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
    <>
      <EventHero
        name={ev.name}
        imageUrl={ev.image_url}
        orgName={org?.name ?? null}
        orgSlug={org?.slug ?? null}
      />
      <EventDetailsSection
        startAt={ev.start_at}
        endAt={ev.end_at}
        venueName={ev.venue_name}
        venueAddress={ev.venue_address}
        onlineEvent={ev.online_event}
        description={ev.description}
      />
      <EventRegistrationSection
        eventName={ev.name}
        eventbriteEventId={ev.eventbrite_event_id}
      />
      <SiteFooter />
    </>
  );
}
