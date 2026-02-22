/**
 * Public CMS API — returns rendered HTML blocks for a published org's website.
 *
 * Called by the Supabase real-time script embedded in static S3 pages.
 * No authentication required — all content here is public-facing.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveVideoPreview } from "@/lib/video-preview";
import {
  renderFeaturedSermon,
  renderPodcast,
  renderWorshipRecordings,
  renderSermonArchive,
  renderEventsGrid,
  renderEventsList,
  renderTeamMembers,
  resolveCmsBinding,
  APP_URL,
} from "@/lib/website-cms-render";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params;
  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS });
  }

  const orgId = (org as { id: string }).id;

  const [
    { data: featuredSermon },
    { data: podcastConfig },
    { data: podcastEpisodes },
    { data: worshipRecordings },
    { data: sermonArchive },
    { data: events },
    { data: teamMembers },
  ] = await Promise.all([
    supabase.from("website_cms_featured_sermon").select("*").eq("organization_id", orgId).maybeSingle(),
    supabase.from("website_cms_podcast_config").select("*").eq("organization_id", orgId).maybeSingle(),
    supabase.from("website_cms_podcast_episodes").select("*").eq("organization_id", orgId).order("episode_number", { ascending: false }),
    supabase.from("website_cms_worship_recordings").select("*").eq("organization_id", orgId).order("sort_order", { ascending: true }),
    supabase.from("website_cms_sermon_archive")
      .select("id, title, tag, image_url, published_at, duration_minutes, speaker_name, video_url, audio_url")
      .eq("organization_id", orgId)
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false }),
    supabase.from("events")
      .select("id, name, description, start_at, image_url, venue_name, eventbrite_event_id, category")
      .eq("organization_id", orgId)
      .gte("start_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order("start_at", { ascending: true }),
    supabase.from("organization_team_members")
      .select("name, role, bio, image_url, sort_order")
      .eq("organization_id", orgId)
      .order("sort_order", { ascending: true }),
  ]);

  const [featuredResolved, ...archiveResolved] = await Promise.all([
    featuredSermon?.video_url ? resolveVideoPreview(featuredSermon.video_url) : Promise.resolve(null),
    ...(sermonArchive ?? []).map((s: Record<string, unknown>) =>
      s.video_url ? resolveVideoPreview(s.video_url as string) : Promise.resolve(null)
    ),
  ]);

  const featuredSermonEnriched =
    featuredSermon != null && featuredResolved
      ? {
          ...featuredSermon,
          videoPreviewType: featuredResolved.type,
          videoPreviewUrl: featuredResolved.type === "mp4" ? featuredResolved.mp4Url : featuredResolved.embedUrl,
          videoThumbnailUrl: featuredResolved.thumbnailUrl ?? undefined,
        }
      : featuredSermon;

  const sermonArchiveEnriched = (sermonArchive ?? []).map((s: Record<string, unknown>, i: number) => {
    const r = archiveResolved[i];
    if (!r) return s;
    return {
      ...s,
      videoPreviewType: r.type,
      videoPreviewUrl: r.type === "mp4" ? r.mp4Url : r.embedUrl,
      videoThumbnailUrl: r.thumbnailUrl ?? undefined,
    };
  });

  const blocks = {
    featured_sermon: renderFeaturedSermon(featuredSermonEnriched),
    podcast: renderPodcast({ config: podcastConfig, episodes: podcastEpisodes ?? [] }),
    worship_recordings: renderWorshipRecordings(worshipRecordings ?? []),
    sermon_archive: renderSermonArchive(
      sermonArchiveEnriched as Parameters<typeof renderSermonArchive>[0]
    ),
    events_grid: renderEventsGrid(events ?? [], APP_URL),
    events_list: renderEventsList(events ?? [], APP_URL),
    team_members: renderTeamMembers(teamMembers ?? []),
  };

  const cmsData = {
    featuredSermon: featuredSermon as Record<string, unknown> | null,
    podcastConfig: podcastConfig as Record<string, unknown> | null,
    podcastEpisodes: (podcastEpisodes ?? []) as Array<Record<string, unknown>>,
    worshipRecordings: (worshipRecordings ?? []) as Array<Record<string, unknown>>,
    sermonArchive: (sermonArchive ?? []) as Array<Record<string, unknown>>,
    events: (events ?? []) as Array<Record<string, unknown>>,
  };

  const BINDING_KEYS = [
    "featured_sermon.title", "featured_sermon.tag", "featured_sermon.description",
    "featured_sermon.image_url", "featured_sermon.video_url", "featured_sermon.audio_url",
    "featured_sermon.speaker_name",
    "podcast.title", "podcast.description", "podcast.spotify_url", "podcast.apple_podcasts_url",
    "events.name", "events.description", "events.start_at", "events.image_url",
    "events.venue_name", "events.category", "events.url",
    "worship_recordings.title", "worship_recordings.subtitle",
    "sermon_archive.title", "sermon_archive.tag", "sermon_archive.image_url",
    "sermon_archive.published_at", "sermon_archive.video_url",
  ];

  const bindings: Record<string, string> = {};
  for (const key of BINDING_KEYS) {
    const v = resolveCmsBinding(key, cmsData);
    if (v) bindings[key] = v;
  }

  return NextResponse.json(
    { orgId, orgSlug, blocks, bindings },
    {
      headers: {
        ...CORS,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
