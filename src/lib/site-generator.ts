/**
 * Generates static HTML pages from a GrapesJS project.
 *
 * Shared between the /site/ dynamic route (Vercel) and the S3 publish pipeline.
 * Extracts pages, rewrites links, and injects CMS content.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { resolveVideoPreview } from "@/lib/video-preview";
import {
  renderFeaturedSermon,
  renderPodcast,
  renderWorshipRecordings,
  renderSermonArchive,
  renderEventsGrid,
  renderEventsList,
  resolveCmsBinding,
  APP_URL,
} from "@/lib/website-cms-render";

export type PageDef = { id?: string; name: string; component?: string };

export type GeneratedPage = {
  slug: string; // "" for home, "about", "contact", etc.
  name: string;
  html: string;
};

const PAGE_ID_TO_SLUG: Record<string, string> = {
  "page-home": "",
  "page-about": "about",
  "page-events": "events",
  "page-give": "give",
  "page-ministries": "ministries",
  "page-media": "media",
  "page-visit": "visit",
};

export function toSlug(name: string): string {
  const s = (name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return s === "home" ? "" : s;
}

/**
 * Rewrite internal links for static hosting.
 * When `forStatic` is true, links use relative paths instead of /site/org/...
 */
export function rewriteLinks(
  html: string,
  basePath: string,
  forStatic = false
): string {
  if (!basePath.endsWith("/")) basePath += "/";
  const baseNoTrail = basePath.replace(/\/$/, "");

  let out = html;

  out = out.replace(/href=["']([a-z0-9-]+)\.html["']/gi, (_, slug) => {
    if (forStatic) {
      return slug === "index" ? `href="/"` : `href="/${slug}"`;
    }
    const path = slug === "index" ? baseNoTrail : `${basePath}${slug}`;
    return `href="${path}"`;
  });

  out = out.replace(/href=["']\/([a-z0-9-]+)\.html["']/gi, (_, slug) => {
    if (forStatic) {
      return slug === "index" ? `href="/"` : `href="/${slug}"`;
    }
    const path = slug === "index" ? baseNoTrail : `${basePath}${slug}`;
    return `href="${path}"`;
  });

  out = out.replace(/href=["']page:\/\/page-([a-z0-9-]+)["']/gi, (_, idPart) => {
    const pageId = `page-${idPart}`;
    const slug = PAGE_ID_TO_SLUG[pageId] ?? idPart;
    if (forStatic) {
      return slug ? `href="/${slug}"` : `href="/"`;
    }
    const path = slug ? `${basePath}${slug}` : baseNoTrail;
    return `href="${path}"`;
  });

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
    const path = forStatic
      ? slug ? `/${slug}` : "/"
      : slug ? `${basePath}${slug}` : baseNoTrail;
    const re = new RegExp(
      `<a href="#"([^>]*)>\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*</a>`,
      "gi"
    );
    out = out.replace(re, `<a href="${path}"$1>${text}</a>`);
  }

  return out;
}

// ---------------------------------------------------------------------------
// CMS injection (same logic as /site/ route)
// ---------------------------------------------------------------------------

export async function injectCmsContent(
  html: string,
  orgId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<string> {
  const needsCms =
    html.includes("{{cms:") ||
    html.includes("data-cms-binding") ||
    html.includes("<!-- cms:");
  if (!needsCms) return html;

  const [
    { data: featuredSermon },
    { data: podcastConfig },
    { data: podcastEpisodes },
    { data: worshipRecordings },
    { data: sermonArchive },
    { data: events },
  ] = await Promise.all([
    supabase.from("website_cms_featured_sermon").select("*").eq("organization_id", orgId).maybeSingle(),
    supabase.from("website_cms_podcast_config").select("*").eq("organization_id", orgId).maybeSingle(),
    supabase.from("website_cms_podcast_episodes").select("*").eq("organization_id", orgId).order("episode_number", { ascending: false }),
    supabase.from("website_cms_worship_recordings").select("*").eq("organization_id", orgId).order("sort_order", { ascending: true }),
    supabase.from("website_cms_sermon_archive").select("id, title, tag, image_url, published_at, duration_minutes, speaker_name, video_url, audio_url").eq("organization_id", orgId).order("sort_order", { ascending: true }).order("published_at", { ascending: false }),
    supabase.from("events").select("id, name, description, start_at, image_url, venue_name, eventbrite_event_id, category").eq("organization_id", orgId).gte("start_at", new Date().toISOString()).order("start_at", { ascending: true }),
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

  let out = html;

  const featuredSermonHtml = renderFeaturedSermon(featuredSermonEnriched);
  if (out.includes("{{cms:featured_sermon}}")) {
    out = out.replace("{{cms:featured_sermon}}", `<div data-cms-block="featured_sermon">${featuredSermonHtml}</div>`);
  }
  if (out.includes("<!-- cms:featured_sermon -->")) {
    out = out.replace(
      /<!-- cms:featured_sermon -->[\s\S]*?<!-- \/cms:featured_sermon -->/g,
      `<!-- cms:featured_sermon -->\n    <h2 class="sec-title" style="margin-bottom:30px;">Featured Sermon</h2>\n    <div data-cms-block="featured_sermon">${featuredSermonHtml.replace(/\$/g, "$$")}</div>\n    <!-- /cms:featured_sermon -->`
    );
  }
  if (out.includes("{{cms:podcast}}")) {
    out = out.replace("{{cms:podcast}}", `<div data-cms-block="podcast">${renderPodcast({ config: podcastConfig, episodes: podcastEpisodes ?? [] })}</div>`);
  }
  if (out.includes("{{cms:worship_recordings}}")) {
    out = out.replace("{{cms:worship_recordings}}", `<div data-cms-block="worship_recordings">${renderWorshipRecordings(worshipRecordings ?? [])}</div>`);
  }
  if (out.includes("{{cms:events_grid}}")) {
    out = out.replace("{{cms:events_grid}}", `<div data-cms-block="events_grid">${renderEventsGrid(events ?? [], APP_URL)}</div>`);
  }
  if (out.includes("{{cms:events_list}}")) {
    out = out.replace("{{cms:events_list}}", `<div data-cms-block="events_list">${renderEventsList(events ?? [], APP_URL)}</div>`);
  }
  if (out.includes("{{cms:sermon_archive}}")) {
    out = out.replace(
      "{{cms:sermon_archive}}",
      `<div data-cms-block="sermon_archive">${renderSermonArchive(sermonArchiveEnriched as Parameters<typeof renderSermonArchive>[0])}</div>`
    );
  }

  if (out.includes("data-cms-binding")) {
    out = injectCmsBindings(out, {
      featuredSermon,
      podcastConfig,
      podcastEpisodes: podcastEpisodes ?? [],
      worshipRecordings: worshipRecordings ?? [],
      sermonArchive: sermonArchive ?? [],
      events: events ?? [],
    });
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
    /<(h[1-6]|p|span|div|td|th|li|strong|em)([^>]*?)data-cms-binding="([^"]+)"([^>]*)>([^<]*)<\/\1>/gi,
    (_, tag, before, binding, after, inner) => {
      const value = resolveCmsBinding(binding, cmsData);
      return `<${tag}${before}data-cms-binding="${binding}"${after}>${esc(value) || inner}</${tag}>`;
    }
  );

  return out;
}

// ---------------------------------------------------------------------------
// Supabase real-time script for live CMS updates on static S3 pages
// ---------------------------------------------------------------------------

/**
 * Builds a self-contained <script> tag that:
 *   1. Fetches fresh CMS blocks from the public API on page load.
 *   2. Subscribes to Supabase real-time to re-fetch whenever CMS data changes.
 *
 * The visitor's browser streams changes directly from Supabase — no polling.
 */
function buildRealtimeScript(orgId: string, orgSlug: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!supabaseUrl || !supabaseKey || !appUrl) return "";

  const safe = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return `<script data-cms-live="1">(function(){
var OID="${safe(orgId)}",OSL="${safe(orgSlug)}";
var SU="${safe(supabaseUrl)}",SK="${safe(supabaseKey)}",AU="${safe(appUrl)}";
var pending=false,timer=null,retries=0;
function esc(s){return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function applyBindings(bindings){
  if(!bindings)return;
  document.querySelectorAll("[data-cms-binding]").forEach(function(el){
    if(el.closest("[data-cms-block]"))return;
    var key=el.getAttribute("data-cms-binding");
    if(!key||!bindings[key])return;
    var v=bindings[key];
    var tag=el.tagName.toLowerCase();
    if(tag==="img"){el.setAttribute("src",v);}
    else if(tag==="a"){
      var isUrl=/\\.(image_url|video_url|audio_url|url|spotify_url|apple_podcasts_url)$/.test(key);
      el.setAttribute("href",v);
      if(!isUrl)el.textContent=v;
    }else{el.textContent=v;}
  });
}
function refresh(){
  if(pending)return;pending=true;
  fetch(AU+"/api/public/cms/"+OSL,{cache:"no-cache"})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(function(d){
      if(!d||!d.blocks)return;retries=0;
      var b=d.blocks;
      Object.keys(b).forEach(function(k){
        var el=document.querySelector('[data-cms-block="'+k+'"]');
        if(el)el.innerHTML=b[k];
      });
      applyBindings(d.bindings);
    })
    .catch(function(){retries++;})
    .finally(function(){pending=false;});
}
refresh();
var s=document.createElement("script");
s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
s.onload=function(){
  try{
    var c=window.supabase.createClient(SU,SK);
    var tables=["website_cms_featured_sermon","website_cms_podcast_config","website_cms_podcast_episodes",
     "website_cms_worship_recordings","website_cms_sermon_archive","events"];
    tables.forEach(function(t){
      c.channel("cms_"+t+"_"+OID)
        .on("postgres_changes",{event:"*",schema:"public",table:t,filter:"organization_id=eq."+OID},
          function(){clearTimeout(timer);timer=setTimeout(refresh,200);})
        .subscribe();
    });
  }catch(e){console.warn("[CMS Live] Realtime init error:",e);}
};
s.onerror=function(){console.warn("[CMS Live] Failed to load Supabase JS client");};
document.head.appendChild(s);
})();</script>`;
}

// ---------------------------------------------------------------------------
// Main: Generate all static pages for a project
// ---------------------------------------------------------------------------

/**
 * Generate static HTML pages from a GrapesJS project.
 * Used by the publish API to create files for S3 upload.
 * The orgSlug is embedded in each page for the real-time CMS script.
 */
export async function generateStaticSite(
  projectJson: { pages?: PageDef[]; default?: { pages?: PageDef[] }; previewHtml?: string } | null,
  orgId: string,
  orgSlug: string
): Promise<GeneratedPage[]> {
  const supabase = createServiceClient();
  const pages = projectJson?.pages ?? projectJson?.default?.pages ?? [];
  const realtimeScript = buildRealtimeScript(orgId, orgSlug);

  if (pages.length === 0) {
    const fallback =
      projectJson?.previewHtml ??
      "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body><h1>No content</h1></body></html>";
    return [{ slug: "", name: "Home", html: fallback }];
  }

  const result: GeneratedPage[] = [];

  for (const page of pages) {
    let html = (page.component as string) ?? "";
    if (!html || html.length < 50) continue;

    const slug = toSlug(page.name);

    // Rewrite links for static hosting (relative paths)
    html = rewriteLinks(html, "/", true);

    // Inject CMS content (with data-cms-block wrappers for real-time targeting)
    html = await injectCmsContent(html, orgId, supabase);

    // Inject real-time script before </body> so CMS stays live after publish
    if (realtimeScript) {
      if (html.includes("</body>")) {
        html = html.replace("</body>", realtimeScript + "\n</body>");
      } else {
        html += realtimeScript;
      }
    }

    result.push({ slug, name: page.name, html });
  }

  if (result.length === 0 && projectJson?.previewHtml) {
    return [{ slug: "", name: "Home", html: projectJson.previewHtml }];
  }

  return result;
}
