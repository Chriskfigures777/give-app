import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/auth";
import { resolveVideoPreview } from "@/lib/video-preview";
import {
  renderFeaturedSermon,
  renderPodcast,
  renderWorshipRecordings,
  renderSermonArchive,
  renderEventsGrid,
  renderEventsList,
  renderTeamMembers,
  renderGiveEmbed,
  injectGiveEmbedFallback,
  resolveCmsBinding,
  APP_URL,
} from "@/lib/website-cms-render";

/**
 * Injects CMS content into HTML for live preview in the editor.
 * Used when loading a project so editors see real CMS data.
 * Adds markers (<!-- cms:BLOCK:start --> ... <!-- cms:BLOCK:end -->) so we can strip on save.
 */
export async function POST(req: NextRequest) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    let body: { organizationId?: string; html: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const orgId = body.organizationId ?? organizationId;
    if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    const html = body.html ?? "";
    if (!html) return NextResponse.json({ html: "" });

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
      supabase.from("website_cms_sermon_archive").select("id, title, tag, image_url, published_at, duration_minutes, speaker_name, video_url, audio_url").eq("organization_id", orgId).order("sort_order", { ascending: true }).order("published_at", { ascending: false }),
      supabase.from("events").select("id, name, description, start_at, image_url, venue_name, eventbrite_event_id, category").eq("organization_id", orgId).gte("start_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()).order("start_at", { ascending: true }),
      supabase.from("organization_team_members").select("name, role, bio, image_url, sort_order").eq("organization_id", orgId).order("sort_order", { ascending: true }),
    ]);

    // Resolve video URLs (Pexels, YouTube, direct MP4) for hover preview
    const [featuredResolved, ...archiveResolved] = await Promise.all([
      featuredSermon?.video_url ? resolveVideoPreview(featuredSermon.video_url) : Promise.resolve(null),
      ...(sermonArchive ?? []).map((s) => (s.video_url ? resolveVideoPreview(s.video_url) : Promise.resolve(null))),
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
    const sermonArchiveEnriched = (sermonArchive ?? []).map((s, i) => {
      const r = archiveResolved[i];
      if (!r) return s;
      return {
        ...s,
        videoPreviewType: r.type,
        videoPreviewUrl: r.type === "mp4" ? r.mp4Url : r.embedUrl,
        videoThumbnailUrl: r.thumbnailUrl ?? undefined,
      };
    });

    const wrap = (blockId: string, content: string) =>
      `<!-- cms:${blockId}:start -->${content}<!-- cms:${blockId}:end -->`;

    let out = html;

    const featuredSermonHtml = renderFeaturedSermon(featuredSermonEnriched);
    if (out.includes("{{cms:featured_sermon}}")) {
      out = out.replace("{{cms:featured_sermon}}", wrap("featured_sermon", featuredSermonHtml));
    }
    if (out.includes("<!-- cms:featured_sermon -->")) {
      out = out.replace(
        /<!-- cms:featured_sermon -->[\s\S]*?<!-- \/cms:featured_sermon -->/g,
        `<!-- cms:featured_sermon -->\n    <h2 class="sec-title" style="margin-bottom:30px;">Featured Sermon</h2>\n    <div data-cms-block="featured_sermon">${wrap("featured_sermon", featuredSermonHtml).replace(/\$/g, "$$")}</div>\n    <!-- /cms:featured_sermon -->`
      );
    }
    if (out.includes("{{cms:podcast}}")) {
      out = out.replace("{{cms:podcast}}", wrap("podcast", renderPodcast({ config: podcastConfig, episodes: podcastEpisodes ?? [] })));
    }
    if (out.includes("{{cms:worship_recordings}}")) {
      out = out.replace("{{cms:worship_recordings}}", wrap("worship_recordings", renderWorshipRecordings(worshipRecordings ?? [])));
    }
    if (out.includes("{{cms:events_grid}}")) {
      out = out.replace("{{cms:events_grid}}", wrap("events_grid", renderEventsGrid(events ?? [], APP_URL)));
    }
    if (out.includes("{{cms:events_list}}")) {
      out = out.replace("{{cms:events_list}}", wrap("events_list", renderEventsList(events ?? [], APP_URL)));
    }
    if (out.includes("{{cms:sermon_archive}}")) {
      out = out.replace("{{cms:sermon_archive}}", wrap("sermon_archive", renderSermonArchive(sermonArchiveEnriched)));
    }
    if (out.includes("{{cms:team_members}}")) {
      out = out.replace("{{cms:team_members}}", wrap("team_members", renderTeamMembers(teamMembers ?? [])));
    }

    const needsSlug =
      out.includes("{{cms:give_embed}}") ||
      out.includes("amount-btn") ||
      out.includes("amount-grid") ||
      out.includes("donate-btn") ||
      out.includes("fund-tab");
    if (needsSlug) {
      const [{ data: orgForSlug }, { data: formCustom }] = await Promise.all([
        supabase.from("organizations").select("slug").eq("id", orgId).single(),
        supabase.from("form_customizations").select("website_embed_card_id").eq("organization_id", orgId).maybeSingle(),
      ]);
      const slug = (orgForSlug as { slug: string } | null)?.slug ?? "";
      const websiteEmbedCardId = (formCustom as { website_embed_card_id?: string | null } | null)?.website_embed_card_id ?? null;
      if (slug) {
        out = injectGiveEmbedFallback(out, slug, websiteEmbedCardId);
      }
    }

    if (out.includes("data-cms-binding")) {
      const cmsData = {
        featuredSermon,
        podcastConfig,
        podcastEpisodes: podcastEpisodes ?? [],
        worshipRecordings: worshipRecordings ?? [],
        sermonArchive: sermonArchive ?? [],
        events: events ?? [],
      };
      out = injectCmsBindings(out, cmsData);
    }

    return NextResponse.json({ html: out });
  } catch (e) {
    console.error("inject-cms:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to inject CMS" },
      { status: 500 }
    );
  }
}

function injectCmsBindings(
  html: string,
  cmsData: {
    featuredSermon: Record<string, unknown> | null;
    podcastConfig: Record<string, unknown> | null;
    podcastEpisodes: Array<Record<string, unknown>>;
    worshipRecordings: Array<Record<string, unknown>>;
    sermonArchive: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
  }
): string {
  const esc = (s: string) =>
    (s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  let out = html;
  out = out.replace(
    /<img([^>]*?)data-cms-binding="([^"]+)"([^>]*?)>/gi,
    (_, before, binding, after) => {
      const value = resolveCmsBinding(binding, cmsData);
      let attrs = before + " " + after;
      if (value) {
        if (/src\s*=/i.test(attrs)) {
          attrs = attrs.replace(/src\s*=\s*["'][^"']*["']/gi, ` src="${esc(value)}"`);
        } else {
          attrs = ` src="${esc(value)}"` + attrs;
        }
      }
      return `<img${attrs.trim()} data-cms-binding="${binding}">`;
    }
  );
  out = out.replace(
    /<a([^>]*?)data-cms-binding="([^"]+)"([^>]*?)>([^<]*)<\/a>/gi,
    (_, before, binding, after, inner) => {
      const value = resolveCmsBinding(binding, cmsData);
      let attrs = before + " " + after;
      const isUrlBinding = /\.(image_url|video_url|audio_url|url|spotify_url|apple_podcasts_url)$/i.test(binding);
      if (value) {
        if (/href\s*=/i.test(attrs)) {
          attrs = attrs.replace(/href\s*=\s*["'][^"']*["']/gi, ` href="${esc(value)}"`);
        } else {
          attrs = ` href="${esc(value)}"` + attrs;
        }
      }
      const content = value && !isUrlBinding ? esc(value) : inner;
      return `<a${attrs.trim()} data-cms-binding="${binding}">${content}</a>`;
    }
  );
  out = out.replace(
    /<(h[1-6]|p|span|div|td|th|li|strong|em)([^>]*?)data-cms-binding="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_, tag, before, binding, after, inner) => {
      const value = resolveCmsBinding(binding, cmsData);
      return `<${tag}${before}data-cms-binding="${binding}"${after}>${esc(value) || inner}</${tag}>`;
    }
  );
  return out;
}
