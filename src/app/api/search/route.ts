import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type SearchOrgResult = {
  id: string;
  name: string;
  slug: string;
  org_type: string | null;
  city: string | null;
  state: string | null;
  causes: string[];
  logo_url: string | null;
  profile_image_url: string | null;
  description: string | null;
  card_preview_image_url: string | null;
  card_preview_video_url: string | null;
  page_hero_video_url: string | null;
};

export type SearchEventResult = {
  id: string;
  name: string;
  slug: string;
  start_at: string;
  venue_name: string | null;
  image_url: string | null;
  online_event: boolean;
  org: { name: string; slug: string } | null;
};

export type SearchResponse = {
  organizations: SearchOrgResult[];
  events: SearchEventResult[];
  total: number;
};

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type") ?? "all"; // church | nonprofit | missionary | event | all
    const city = searchParams.get("city")?.trim();
    const state = searchParams.get("state")?.trim();
    const cause = searchParams.get("cause")?.trim();
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

    const supabase = await createClient();

    const isOrgType = type === "church" || type === "nonprofit" || type === "missionary" || type === "all";
    const isEventType = type === "event" || type === "all";

    let organizations: SearchOrgResult[] = [];
    let events: SearchEventResult[] = [];

    if (isOrgType) {
      let orgQuery = supabase
        .from("organizations")
        .select("id, name, slug, org_type, city, state, causes, logo_url, profile_image_url, description, card_preview_image_url, card_preview_video_url, page_hero_video_url")
        .not("stripe_connect_account_id", "is", null)
        .order("name")
        .range(offset, offset + limit - 1);

      if (type === "church") orgQuery = orgQuery.eq("org_type", "church");
      else if (type === "nonprofit") orgQuery = orgQuery.eq("org_type", "nonprofit");
      else if (type === "missionary") orgQuery = orgQuery.eq("org_type", "missionary");

      if (city) orgQuery = orgQuery.ilike("city", `%${city}%`);
      if (state) orgQuery = orgQuery.ilike("state", `%${state}%`);
      if (cause) orgQuery = orgQuery.contains("causes", [cause]);

      if (q.length >= 2) {
        const term = `%${q}%`;
        orgQuery = orgQuery.or(
          `name.ilike.${term},slug.ilike.${term},description.ilike.${term}`
        );
      }

      const { data: orgData, error: orgError } = await orgQuery;

      if (orgError) {
        console.error("Search orgs error:", orgError);
        return NextResponse.json(
          { error: "Failed to search organizations" },
          { status: 500 }
        );
      }

      organizations = (orgData ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        org_type: row.org_type as string | null,
        city: (row.city as string | null) ?? null,
        state: (row.state as string | null) ?? null,
        causes: Array.isArray(row.causes) ? row.causes : [],
        logo_url: (row.logo_url as string | null) ?? null,
        profile_image_url: (row.profile_image_url as string | null) ?? null,
        description: (row.description as string | null) ?? null,
        card_preview_image_url: (row.card_preview_image_url as string | null) ?? null,
        card_preview_video_url: (row.card_preview_video_url as string | null) ?? null,
        page_hero_video_url: (row.page_hero_video_url as string | null) ?? null,
      }));
    }

    if (isEventType) {
      const eventSelect = `
        id, slug, name, start_at, venue_name, image_url, online_event,
        organizations(name, slug)
      `;

      let eventQuery = supabase
        .from("events")
        .select(eventSelect)
        .gte("end_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .range(offset, offset + limit - 1);

      if (q.length >= 2) {
        const term = `%${q}%`;
        eventQuery = eventQuery.or(`name.ilike.${term},description.ilike.${term}`);
      }

      const { data: eventData, error: eventError } = await eventQuery;

      if (eventError) {
        console.error("Search events error:", eventError);
      } else {
        events = (eventData ?? []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          name: row.name as string,
          slug: row.slug as string,
          start_at: row.start_at as string,
          venue_name: (row.venue_name as string | null) ?? null,
          image_url: (row.image_url as string | null) ?? null,
          online_event: (row.online_event as boolean) ?? false,
          org: (row.organizations as { name: string; slug: string } | null) ?? null,
        }));
      }
    }

    const total = organizations.length + events.length;

    return NextResponse.json({
      organizations,
      events,
      total,
    } satisfies SearchResponse);
  } catch (e) {
    console.error("Search API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
