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
  injectGiveEmbedFallback,
  resolveCmsBinding,
  APP_URL,
} from "@/lib/website-cms-render";
import { injectFormsScript } from "@/lib/site-forms";

export const dynamic = "force-dynamic";

type PageDef = { id?: string; name: string; component?: string };

function toSlug(name: string): string {
  const s = (name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return s === "home" ? "" : s;
}

const PAGE_ID_TO_SLUG: Record<string, string> = {
  "page-home": "",
  "page-about": "about",
  "page-events": "events",
  "page-give": "give",
  "page-ministries": "ministries",
  "page-media": "media",
  "page-visit": "visit",
};

function rewriteLinks(html: string, basePath: string, previewProjectId?: string | null): string {
  if (!basePath.endsWith("/")) basePath += "/";
  const baseNoTrail = basePath.replace(/\/$/, "");
  const qs = previewProjectId ? `?preview=${encodeURIComponent(previewProjectId)}` : "";
  let out = html;

  out = out.replace(/href=["']([a-z0-9-]+)\.html["']/gi, (_, slug) => {
    const path = slug === "index" ? baseNoTrail : `${basePath}${slug}`;
    return `href="${path}${qs}"`;
  });
  out = out.replace(/href=["']\/([a-z0-9-]+)\.html["']/gi, (_, slug) => {
    const path = slug === "index" ? baseNoTrail : `${basePath}${slug}`;
    return `href="${path}${qs}"`;
  });
  out = out.replace(/href=["']page:\/\/page-([a-z0-9-]+)["']/gi, (_, idPart) => {
    const pageId = `page-${idPart}`;
    const slug = PAGE_ID_TO_SLUG[pageId] ?? idPart;
    const path = slug ? `${basePath}${slug}` : baseNoTrail;
    return `href="${path}${qs}"`;
  });
  // Convert hash links that exactly match page slugs to proper page URLs.
  // Home pages often use #about, #ministries etc. for single-page scroll nav,
  // but on the multi-page site these should navigate to the actual pages.
  const hashToSlug: Record<string, string> = {
    "#home": "",
    "#about": "about",
    "#events": "events",
    "#give": "give",
    "#ministries": "ministries",
    "#media": "media",
    "#visit": "visit",
  };
  for (const [hash, slug] of Object.entries(hashToSlug)) {
    const path = slug ? `${basePath}${slug}` : baseNoTrail;
    const escaped = hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`href=["']${escaped}["']`, "gi");
    out = out.replace(re, `href="${path}${qs}"`);
  }

  const textToSlug: Record<string, string> = {
    Home: "",
    About: "about",
    Events: "events",
    Give: "give",
    Ministries: "ministries",
    Media: "media",
    "Visit Us": "visit",
    "About Us": "about",
  };
  for (const [text, slug] of Object.entries(textToSlug)) {
    const path = slug ? `${basePath}${slug}` : baseNoTrail;
    const re = new RegExp(`<a href="#"([^>]*)>\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*</a>`, "gi");
    out = out.replace(re, `<a href="${path}${qs}"$1>${text}</a>`);
  }

  // Catch links already in /site/orgSlug/slug format (from a previous save cycle)
  // and ensure they carry the preview param when in preview mode
  if (qs) {
    const escaped = baseNoTrail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(
      new RegExp(`href="(${escaped}(?:/[a-z0-9-]*)?)"`, "gi"),
      (match, path) => {
        if (match.includes("?preview=")) return match;
        return `href="${path}${qs}"`;
      }
    );
  }

  return out;
}

async function injectCmsContent(
  html: string,
  orgId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<string> {
  const needsCms =
    html.includes("{{cms:") ||
    html.includes("data-cms-binding") ||
    html.includes("<!-- cms:");
  if (!needsCms) return html;

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .single();
  const orgSlug = (orgRow as { slug: string } | null)?.slug ?? "";

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

  let out = html;

  // Featured Sermon: replace placeholder or entire CMS block (handles editor-saved static fallback)
  const featuredSermonHtml = renderFeaturedSermon(featuredSermonEnriched);
  if (out.includes("{{cms:featured_sermon}}")) {
    out = out.replace("{{cms:featured_sermon}}", featuredSermonHtml);
  }
  if (out.includes("<!-- cms:featured_sermon -->")) {
    out = out.replace(
      /<!-- cms:featured_sermon -->[\s\S]*?<!-- \/cms:featured_sermon -->/g,
      `<!-- cms:featured_sermon -->\n    <h2 class="sec-title" style="margin-bottom:30px;">Featured Sermon</h2>\n    <div data-cms-block="featured_sermon">${featuredSermonHtml.replace(/\$/g, "$$")}</div>\n    <!-- /cms:featured_sermon -->`
    );
  }
  if (out.includes("{{cms:podcast}}")) {
    out = out.replace(
      "{{cms:podcast}}",
      renderPodcast({ config: podcastConfig, episodes: podcastEpisodes ?? [] })
    );
  }
  if (out.includes("{{cms:worship_recordings}}")) {
    out = out.replace(
      "{{cms:worship_recordings}}",
      renderWorshipRecordings(worshipRecordings ?? [])
    );
  }
  if (out.includes("{{cms:events_grid}}")) {
    out = out.replace(
      "{{cms:events_grid}}",
      renderEventsGrid(events ?? [], APP_URL)
    );
  }
  if (out.includes("{{cms:events_list}}")) {
    out = out.replace(
      "{{cms:events_list}}",
      renderEventsList(events ?? [], APP_URL)
    );
  }
  if (out.includes("{{cms:sermon_archive}}")) {
    out = out.replace(
      "{{cms:sermon_archive}}",
      renderSermonArchive(sermonArchiveEnriched)
    );
  }
  if (out.includes("{{cms:team_members}}")) {
    out = out.replace(
      "{{cms:team_members}}",
      renderTeamMembers(teamMembers ?? [])
    );
  }
  // Give embed is handled by injectGiveEmbedFallback (with theme detection)
  // after injectCmsContent returns — do NOT replace here without a theme.

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

  return out;
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; pageSlug?: string[] }> }
) {
  const { orgSlug, pageSlug } = await params;
  const previewProjectId = req.nextUrl.searchParams.get("preview");

  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, slug, published_website_project_id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return new NextResponse("Organization not found", { status: 404 });
  }

  let projectId: string | null = null;
  if (previewProjectId) {
    projectId = previewProjectId;
  } else if ((org as { published_website_project_id?: string | null }).published_website_project_id) {
    projectId = (org as { published_website_project_id: string }).published_website_project_id;
  } else {
    return new NextResponse(
      "<!DOCTYPE html><html><body style='font-family:sans-serif;padding:40px;text-align:center;'><h1>Not published</h1><p>This site has not been published yet.</p></body></html>",
      {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  const { data: projectRow } = await supabase
    .from("website_builder_projects")
    .select("id, project, organization_id")
    .eq("id", projectId)
    .eq("organization_id", org.id)
    .maybeSingle();

  if (!projectRow) {
    return new NextResponse("Project not found", { status: 404 });
  }

  const project = projectRow.project as {
    pages?: PageDef[];
    default?: { pages?: PageDef[] };
    previewHtml?: string;
  } | null;

  const pages = project?.pages ?? project?.default?.pages ?? [];
  const basePath = `/site/${orgSlug}`;

  let pageSlugStr = Array.isArray(pageSlug) && pageSlug.length > 0 ? pageSlug[0] : null;
  // Normalize: about.html -> about (published/preview routes should not use .html)
  if (pageSlugStr?.endsWith(".html")) {
    pageSlugStr = pageSlugStr.slice(0, -5);
  }
  const wantHome = !pageSlugStr || pageSlugStr === "" || pageSlugStr.toLowerCase() === "home";

  let html: string;

  if (pages.length === 0) {
    html =
      project?.previewHtml ??
      "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body><h1>No content</h1></body></html>";
  } else if (pages.length === 1 || wantHome) {
    const first = pages[0];
    const comp = first?.component ?? "";
    // Use the actual Home page component, not project.previewHtml (which is a small card preview)
    if (typeof comp === "string" && comp.length > 50) {
      html = comp;
    } else {
      html =
        project?.previewHtml ??
        "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body><h1>No content</h1></body></html>";
    }
  } else {
    const slugLower = (pageSlugStr ?? "").toLowerCase();
    const page = pages.find((p) => {
      const nameSlug = toSlug(p.name);
      const idSlug = p.id ? p.id.replace(/^page-/, "") : "";
      return (
        nameSlug === slugLower ||
        idSlug === slugLower ||
        p.name.toLowerCase() === slugLower
      );
    });
    if (!page) {
      const first = pages[0];
      html = (first?.component as string) ?? "";
      if (!html) {
        return new NextResponse("Page not found", { status: 404 });
      }
    } else {
      html = (page.component as string) ?? "";
      if (!html) {
        return new NextResponse("Page not found", { status: 404 });
      }
    }
  }

  html = rewriteLinks(html, basePath, previewProjectId);

  // Inject CMS content for org (events, media)
  const orgId = (org as { id: string }).id;
  html = await injectCmsContent(html, orgId, supabase);

  // Fetch website form selection (which embed card to use on website)
  const { data: formCustom } = await supabase
    .from("form_customizations")
    .select("website_embed_card_id")
    .eq("organization_id", orgId)
    .maybeSingle();
  const websiteEmbedCardId = (formCustom as { website_embed_card_id?: string | null } | null)?.website_embed_card_id ?? null;

  // Replace static give forms with working embedded donate iframe
  html = injectGiveEmbedFallback(html, orgSlug, websiteEmbedCardId);

  // Inject forms script so template <form> elements post to the platform
  html = injectFormsScript(html, orgSlug);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
