import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { EventHero } from "./event-hero";
import { EventDetailsSection } from "./event-details-section";
import { EventRegistrationSection } from "./event-registration-section";
import { SiteFooter } from "@/components/site-footer";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function looksLikeUuid(param: string): boolean {
  return UUID_REGEX.test(param);
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  let event = (await supabase.from("events").select("name, description").eq("id", id).single())
    .data;
  if (!event && !looksLikeUuid(id)) {
    event = (await supabase.from("events").select("name, description").eq("slug", id).single())
      .data;
  }

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
  const { id: param } = await params;
  const supabase = await createClient();

  const select = `
    id, slug, name, description, start_at, end_at,
    venue_name, venue_address, online_event, image_url,
    eventbrite_event_id,
    organizations(name, slug)
  `;

  let event = (await supabase.from("events").select(select).eq("id", param).single()).data;

  // If param looks like slug (e.g. "test-2"), try slug and redirect to canonical ID URL
  if (!event && !looksLikeUuid(param)) {
    const bySlug = (await supabase.from("events").select("id").eq("slug", param).single()).data;
    if (bySlug) {
      redirect(`/events/${(bySlug as { id: string }).id}`);
    }
  }

  if (!event) notFound();

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
