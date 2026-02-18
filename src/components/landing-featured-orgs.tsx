import { createClient } from "@/lib/supabase/server";
import { OrgResultCard } from "@/components/explore/org-result-card";
import { EventResultCard } from "@/components/explore/event-result-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TARGET_CARD_COUNT = 6;

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  org_type: string | null;
  city: string | null;
  state: string | null;
  causes: string[];
  logo_url: string | null;
  profile_image_url?: string | null;
  description: string | null;
  card_preview_image_url?: string | null;
  card_preview_video_url?: string | null;
  page_hero_video_url?: string | null;
};

type EventRow = {
  id: string;
  name: string;
  slug: string;
  start_at: string;
  venue_name: string | null;
  image_url: string | null;
  online_event: boolean;
  org: { name: string; slug: string } | null;
};

export async function LandingFeaturedOrgs() {
  const supabase = await createClient();

  const { data: churchData } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, org_type, city, state, causes, logo_url, profile_image_url, description, card_preview_image_url, card_preview_video_url, page_hero_video_url"
    )
    .not("stripe_connect_account_id", "is", null)
    .eq("org_type", "church")
    .order("name")
    .limit(TARGET_CARD_COUNT);

  let orgs = (churchData ?? []) as OrgRow[];

  if (orgs.length < TARGET_CARD_COUNT) {
    const { data: moreData } = await supabase
      .from("organizations")
      .select(
        "id, name, slug, org_type, city, state, causes, logo_url, profile_image_url, description, card_preview_image_url, card_preview_video_url, page_hero_video_url"
      )
      .not("stripe_connect_account_id", "is", null)
      .or("org_type.neq.church,org_type.is.null")
      .order("name")
      .limit(TARGET_CARD_COUNT - orgs.length);

    const moreRaw = (moreData ?? []) as OrgRow[];
    const existingIds = new Set(orgs.map((o) => o.id));
    const more = moreRaw.filter((o) => !existingIds.has(o.id));
    orgs = [...orgs, ...more];
  }

  let events: EventRow[] = [];
  if (orgs.length < TARGET_CARD_COUNT) {
    const { data: eventData } = await supabase
      .from("events")
      .select(
        "id, slug, name, start_at, venue_name, image_url, online_event, organizations(name, slug)"
      )
      .gte("end_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(TARGET_CARD_COUNT - orgs.length);

    events = (eventData ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      start_at: row.start_at as string,
      venue_name: (row.venue_name as string | null) ?? null,
      image_url: (row.image_url as string | null) ?? null,
      online_event: (row.online_event as boolean) ?? false,
      org:
        (row.organizations as { name: string; slug: string } | null) ?? null,
    }));
  }

  const normalizedOrgs = orgs.map((o) => ({
    ...o,
    causes: Array.isArray(o.causes) ? o.causes : [],
    card_preview_image_url: o.card_preview_image_url ?? null,
    card_preview_video_url: o.card_preview_video_url ?? null,
    page_hero_video_url: o.page_hero_video_url ?? null,
  }));

  const totalCards = normalizedOrgs.length + events.length;
  if (totalCards === 0) return null;

  return (
    <section className="relative bg-slate-50/50 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Featured
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Organizations making an impact
            </h2>
            <p className="mt-3 max-w-xl text-lg text-slate-600">
              Churches and nonprofits you can support in Grand Rapids and beyond.
            </p>
          </div>
          <Link
            href="/explore"
            className="glow-btn group inline-flex shrink-0 items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-slate-800"
          >
            Browse all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {normalizedOrgs.map((org, i) => (
            <OrgResultCard key={`org-${org.id}`} org={org} index={i} />
          ))}
          {events.map((ev, i) => (
            <EventResultCard
              key={`event-${ev.id}`}
              event={ev}
              index={normalizedOrgs.length + i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
