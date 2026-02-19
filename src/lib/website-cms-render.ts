/**
 * Renders CMS blocks as HTML for the church template.
 * Used by the site route to replace {{cms:xxx}} placeholders.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.DOMAIN || "https://give-app78.vercel.app";

function esc(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HOVER_VIDEO_STYLES = `<style>.sf-thumb:hover .sf-video-preview,.sc-thumb:hover .sc-video-preview,.sf-thumb:hover .sf-embed-preview,.sc-thumb:hover .sc-embed-preview{opacity:1}.sf-video-preview,.sc-video-preview,.sf-embed-preview,.sc-embed-preview{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .4s ease-in-out;pointer-events:none;}.sf-video-preview,.sc-video-preview{object-fit:cover;}.sf-embed-preview,.sc-embed-preview{border:none;}</style>`;

export function renderFeaturedSermon(data: {
  title: string;
  tag: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  duration_minutes: number | null;
  speaker_name: string | null;
  videoPreviewType?: "mp4" | "youtube";
  videoPreviewUrl?: string | null;
  videoThumbnailUrl?: string | null;
} | null): string {
  if (!data?.title) {
    return `<div class="sermon-featured">
      <div class="sf-thumb"><img src="https://images.pexels.com/photos/8468459/pexels-photo-8468459.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Sermon" data-cms-field="featured_sermon.image_url"><div class="sf-play"><button class="play-btn">▶</button></div></div>
      <div class="sf-info">
        <span class="tag" data-cms-field="featured_sermon.tag">Current Series · Week 4</span>
        <h2 data-cms-field="featured_sermon.title">"When God Feels Distant"</h2>
        <p data-cms-field="featured_sermon.description">Pastor David walks us through the Psalms of Ascent to show how Israel clung to God in the valleys — and how we can too.</p>
        <div class="sf-meta" data-cms-field="featured_sermon.speaker_name">📅 February 9, 2025 · ⏱ 47 mins · Pastor David Mercer</div>
        <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;">
          <a href="#" class="btn-primary" style="font-size:13px;padding:10px 22px;" data-cms-field="featured_sermon.video_url">▶ Watch Now</a>
          <a href="#" class="btn-outline" style="font-size:13px;padding:10px 22px;" data-cms-field="featured_sermon.audio_url">🎧 Listen</a>
        </div>
      </div>
    </div>`;
  }
  const img = data.image_url || "https://images.pexels.com/photos/8468459/pexels-photo-8468459.jpeg?auto=compress&cs=tinysrgb&w=800";
  const meta = [
    data.duration_minutes ? `⏱ ${data.duration_minutes} mins` : null,
    data.speaker_name ? esc(data.speaker_name) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const watchUrl = data.video_url || "#";
  const listenUrl = data.audio_url || "#";
  const videoPreviewType = data.videoPreviewType ?? null;
  const videoPreviewUrl = data.videoPreviewUrl ?? null;
  const videoThumbnailUrl = data.videoThumbnailUrl ?? null;
  const posterImg = videoThumbnailUrl || img;
  const hasPreview = videoPreviewUrl && videoPreviewType;
  const thumbContent = hasPreview
    ? videoPreviewType === "youtube"
      ? `<img src="${esc(posterImg)}" alt="Sermon" data-cms-binding="featured_sermon.image_url"><iframe class="sf-embed-preview" data-src="${esc(videoPreviewUrl)}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe><div class="sf-play"><button class="play-btn" onclick="window.open('${esc(watchUrl)}','_blank')">▶</button></div>`
      : `<img src="${esc(posterImg)}" alt="Sermon" data-cms-binding="featured_sermon.image_url"><video class="sf-video-preview" poster="${esc(posterImg)}" muted loop playsinline preload="metadata"><source src="${esc(videoPreviewUrl)}" type="video/mp4"></video><div class="sf-play"><button class="play-btn" onclick="window.open('${esc(watchUrl)}','_blank')">▶</button></div>`
    : `<img src="${esc(img)}" alt="Sermon" data-cms-binding="featured_sermon.image_url"><div class="sf-play"><button class="play-btn" onclick="window.open('${esc(watchUrl)}','_blank')">▶</button></div>`;
  const hoverStyles = hasPreview ? HOVER_VIDEO_STYLES : "";
  const thumbHandlers = hasPreview
    ? videoPreviewType === "mp4"
      ? ` onmouseenter="var v=this.querySelector('.sf-video-preview');if(v)v.play()" onmouseleave="var v=this.querySelector('.sf-video-preview');if(v)v.pause()"`
      : ` onmouseenter="var f=this.querySelector('.sf-embed-preview');if(f&&!f.src)f.src=f.dataset.src||''"`
      : "";
  return `${hoverStyles}<div class="sermon-featured">
    <div class="sf-thumb"${thumbHandlers}>${thumbContent}</div>
    <div class="sf-info">
      ${data.tag ? `<span class="tag" data-cms-binding="featured_sermon.tag">${esc(data.tag)}</span>` : ""}
      <h2 data-cms-binding="featured_sermon.title">"${esc(data.title)}"</h2>
      ${data.description ? `<p data-cms-binding="featured_sermon.description">${esc(data.description)}</p>` : ""}
      ${meta ? `<div class="sf-meta" data-cms-field="featured_sermon.speaker_name">${meta}</div>` : ""}
      <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;">
        <a href="${esc(watchUrl)}" class="btn-primary" style="font-size:13px;padding:10px 22px;" target="_blank" rel="noopener" data-cms-binding="featured_sermon.video_url">▶ Watch Now</a>
        <a href="${esc(listenUrl)}" class="btn-outline" style="font-size:13px;padding:10px 22px;" target="_blank" rel="noopener" data-cms-binding="featured_sermon.audio_url">🎧 Listen</a>
      </div>
    </div>
  </div>`;
}

export function renderPodcast(data: {
  config: { title: string; description: string | null; spotify_url: string | null; apple_podcasts_url: string | null } | null;
  episodes: Array<{ episode_number: number; title: string; published_at: string | null; duration_minutes: number | null }>;
}): string {
  const config = data.config;
  const episodes = data.episodes ?? [];
  const title = config?.title ?? "Grace Daily Podcast";
  const desc = config?.description ?? "Short daily devotionals to start your morning rooted in the Word. Available on Spotify, Apple Podcasts, and YouTube.";
  const spotify = config?.spotify_url || "#";
  const apple = config?.apple_podcasts_url || "#";

  const episodesHtml = episodes.length
    ? episodes
        .slice(0, 5)
        .map(
          (ep) =>
            `<div class="pod-ep"><div class="ep-num" data-cms-field="podcast_episodes.episode_number">${ep.episode_number}</div><div class="ep-info"><h5 data-cms-field="podcast_episodes.title">${esc(ep.title)}</h5><p data-cms-field="podcast_episodes.published_at">${ep.published_at ? new Date(ep.published_at).toLocaleDateString() : ""}</p></div><div class="ep-dur" data-cms-field="podcast_episodes.duration_minutes">${ep.duration_minutes ? ep.duration_minutes + " min" : ""}</div></div>`
        )
        .join("")
    : `<div class="pod-ep"><div class="ep-num" data-cms-field="podcast_episodes.episode_number">1</div><div class="ep-info"><h5 data-cms-field="podcast_episodes.title">The Power of Persistent Prayer</h5><p data-cms-field="podcast_episodes.published_at">Feb 12, 2025</p></div><div class="ep-dur" data-cms-field="podcast_episodes.duration_minutes">12 min</div></div>
      <div class="pod-ep"><div class="ep-num" data-cms-field="podcast_episodes.episode_number">2</div><div class="ep-info"><h5 data-cms-field="podcast_episodes.title">When Waiting Feels Like Wasting</h5><p data-cms-field="podcast_episodes.published_at">Feb 11, 2025</p></div><div class="ep-dur" data-cms-field="podcast_episodes.duration_minutes">9 min</div></div>`;

  return `<h2 class="sec-title light" data-cms-field="podcast.title">${esc(title)}</h2>
    <div class="gold-divider"></div>
    <p style="color:rgba(255,255,255,0.65);line-height:1.8;margin-bottom:28px;" data-cms-field="podcast.description">${esc(desc)}</p>
    <div class="btns"><a href="${esc(spotify)}" class="btn-primary" target="_blank" rel="noopener" data-cms-field="podcast.spotify_url">🎧 Listen on Spotify</a><a href="${esc(apple)}" class="btn-outline" target="_blank" rel="noopener" data-cms-field="podcast.apple_podcasts_url">Apple Podcasts</a></div>
    <div class="podcast-row" style="margin-top:32px;">${episodesHtml}</div>`;
}

export function renderWorshipRecordings(recordings: Array<{ title: string; subtitle: string | null }>): string {
  const items = recordings?.length
    ? recordings.map(
        (r) =>
          `<div style="background:rgba(255,255,255,0.06);border-radius:10px;padding:16px;display:flex;gap:16px;align-items:center;"><div style="font-size:28px;">🎵</div><div><div style="color:white;font-weight:600;font-size:15px;" data-cms-field="worship_recordings.title">${esc(r.title)}</div>${r.subtitle ? `<div style="color:rgba(255,255,255,0.45);font-size:12px;" data-cms-field="worship_recordings.subtitle">${esc(r.subtitle)}</div>` : ""}</div></div>`
      )
      .join("")
    : `<div style="background:rgba(255,255,255,0.06);border-radius:10px;padding:16px;display:flex;gap:16px;align-items:center;"><div style="font-size:28px;">🎵</div><div><div style="color:white;font-weight:600;font-size:15px;" data-cms-field="worship_recordings.title">"Great Are You Lord" — Live at Grace</div><div style="color:rgba(255,255,255,0.45);font-size:12px;" data-cms-field="worship_recordings.subtitle">Feb 9 Worship Set · 6:14</div></div></div>`;

  return `<h2 class="sec-title light" data-cms-field="worship_recordings.title">Live Worship Recordings</h2>
    <div class="gold-divider"></div>
    <div style="display:flex;flex-direction:column;gap:16px;margin-top:24px;">${items}</div>`;
}

export function renderSermonArchive(
  sermons: Array<{
    title: string;
    tag: string | null;
    image_url: string | null;
    published_at: string | null;
    duration_minutes: number | null;
    speaker_name: string | null;
    video_url: string | null;
    videoPreviewType?: "mp4" | "youtube";
    videoPreviewUrl?: string | null;
    videoThumbnailUrl?: string | null;
  }>
): string {
  const hasAnyVideoPreview = sermons?.some((s) => s.videoPreviewUrl) ?? false;
  const items = sermons?.length
    ? sermons.map(
        (s) => {
          const img = s.image_url || "https://images.pexels.com/photos/2566573/pexels-photo-2566573.jpeg?auto=compress&cs=tinysrgb&w=600";
          const posterImg = s.videoThumbnailUrl ?? img;
          const dateStr = s.published_at ? new Date(s.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
          const meta = [dateStr, s.duration_minutes ? `${s.duration_minutes} mins` : null, s.speaker_name ? esc(s.speaker_name) : null].filter(Boolean).join(" · ");
          const watchUrl = s.video_url || "#";
          const videoPreviewType = s.videoPreviewType ?? null;
          const videoPreviewUrl = s.videoPreviewUrl ?? null;
          const hasPreview = videoPreviewUrl && videoPreviewType;
          const thumbContent = hasPreview
            ? videoPreviewType === "youtube"
              ? `<img src="${esc(posterImg)}" alt="${esc(s.title)}" data-cms-field="sermon_archive.image_url"><iframe class="sc-embed-preview" data-src="${esc(videoPreviewUrl)}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe><div class="sc-play"><a href="${esc(watchUrl)}" target="_blank" rel="noopener" class="sc-play-sm">▶</a></div>`
              : `<img src="${esc(posterImg)}" alt="${esc(s.title)}" data-cms-field="sermon_archive.image_url"><video class="sc-video-preview" poster="${esc(posterImg)}" muted loop playsinline preload="metadata"><source src="${esc(videoPreviewUrl)}" type="video/mp4"></video><div class="sc-play"><a href="${esc(watchUrl)}" target="_blank" rel="noopener" class="sc-play-sm">▶</a></div>`
            : `<img src="${esc(img)}" alt="${esc(s.title)}" data-cms-field="sermon_archive.image_url"><div class="sc-play"><a href="${esc(watchUrl)}" target="_blank" rel="noopener" class="sc-play-sm">▶</a></div>`;
          const thumbAttrs = hasPreview
            ? videoPreviewType === "mp4"
              ? ` onmouseenter="var v=this.querySelector('.sc-video-preview');if(v)v.play()" onmouseleave="var v=this.querySelector('.sc-video-preview');if(v)v.pause()"`
              : ` onmouseenter="var f=this.querySelector('.sc-embed-preview');if(f&&!f.src)f.src=f.dataset.src||''"`
              : "";
          return `<div class="sc"><div class="sc-thumb"${thumbAttrs}>${thumbContent}</div><div class="sc-body"><div class="stag" data-cms-field="sermon_archive.tag">${esc(s.tag || "Sermon")}</div><h4 data-cms-field="sermon_archive.title">"${esc(s.title)}"</h4><div class="smeta">${meta}</div></div></div>`;
        }
      )
      .join("")
    : `<div class="sc"><div class="sc-thumb"><img src="https://images.pexels.com/photos/2566573/pexels-photo-2566573.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Sermon"><div class="sc-play"><div class="sc-play-sm">▶</div></div></div><div class="sc-body"><div class="stag">Series: Valleys &amp; Mountaintops</div><h4>"Faith in the Fire"</h4><div class="smeta">Feb 2, 2025 · 42 mins · Pastor David</div></div></div>
      <div class="sc"><div class="sc-thumb"><img src="https://images.pexels.com/photos/5206038/pexels-photo-5206038.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Sermon"><div class="sc-play"><div class="sc-play-sm">▶</div></div></div><div class="sc-body"><div class="stag">Series: Valleys &amp; Mountaintops</div><h4>"The God Who Restores"</h4><div class="smeta">Jan 26, 2025 · 38 mins · Pastor David</div></div></div>
      <div class="sc"><div class="sc-thumb"><img src="https://images.pexels.com/photos/1701535/pexels-photo-1701535.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Sermon"><div class="sc-play"><div class="sc-play-sm">▶</div></div></div><div class="sc-body"><div class="stag">Guest Speaker</div><h4>"Called to More"</h4><div class="smeta">Jan 19, 2025 · 51 mins · Dr. James K. Obi</div></div></div>`;

  const hoverStyles = hasAnyVideoPreview ? HOVER_VIDEO_STYLES : "";
  return `${hoverStyles}<div class="sermon-grid">${items}</div>`;
}

export function renderEventsGrid(
  events: Array<{
    id: string;
    name: string;
    description: string | null;
    start_at: string;
    image_url: string | null;
    venue_name: string | null;
    eventbrite_event_id: string | null;
    category?: string | null;
  }>,
  appUrl: string
): string {
  const base = appUrl.replace(/\/$/, "");
  if (!events?.length) {
    return `<div class="ev-grid">
      <div class="ev-card"><img src="https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Event" data-cms-field="events.image_url"><div class="ev-body"><div class="ev-meta"><span class="ev-date-pill" data-cms-field="events.start_at">—</span><span class="ev-cat" data-cms-field="events.category">Event</span></div><h3 data-cms-field="events.name">No upcoming events</h3><p data-cms-field="events.description">Check back soon for new events.</p><div style="margin-top:16px;"></div></div></div>
    </div>`;
  }
  return `<div class="ev-grid">${events
    .slice(0, 4)
    .map((e) => {
      const d = new Date(e.start_at);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const img = e.image_url || "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=700";
      const regUrl = e.eventbrite_event_id
        ? `https://www.eventbrite.com/e/${e.eventbrite_event_id}`
        : `${base}/events/${e.id}`;
      const regText = e.eventbrite_event_id ? "Register Free" : "View Details";
      const catLabel = (e as { category?: string | null }).category || "Event";
      return `<div class="ev-card"><img src="${esc(img)}" alt="${esc(e.name)}" data-cms-field="events.image_url"><div class="ev-body"><div class="ev-meta"><span class="ev-date-pill" data-cms-field="events.start_at">${esc(dateStr)}</span><span class="ev-cat" data-cms-field="events.category">${esc(catLabel)}</span></div><h3 data-cms-field="events.name">${esc(e.name)}</h3><p data-cms-field="events.description">${esc(e.description || "").slice(0, 120)}...</p><div class="ev-detail">📍 <span data-cms-field="events.venue_name">${esc(e.venue_name || "TBA")}</span></div><div class="ev-detail">🕐 ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div><div style="margin-top:16px;"><a href="${esc(regUrl)}" class="btn-primary" style="font-size:13px;padding:10px 22px;" target="_blank" rel="noopener" data-cms-field="events.url">${regText}</a></div></div></div>`;
    })
    .join("")}</div>`;
}

export function renderEventsList(
  events: Array<{
    id: string;
    name: string;
    start_at: string;
    venue_name: string | null;
    eventbrite_event_id: string | null;
  }>,
  appUrl: string
): string {
  const base = appUrl.replace(/\/$/, "");
  if (!events?.length) {
    return `<div class="ev-full-list"><div class="erow"><div class="edate" data-cms-field="events.start_at"><div class="em">—</div><div class="eday">—</div></div><div class="einfo"><h4 data-cms-field="events.name">No upcoming events</h4><p data-cms-field="events.description">Check back soon.</p></div><div></div></div></div>`;
  }
  return `<div class="ev-full-list">${events
    .slice(0, 10)
    .map((e) => {
      const d = new Date(e.start_at);
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const day = d.getDate();
      const regUrl = e.eventbrite_event_id
        ? `https://www.eventbrite.com/e/${e.eventbrite_event_id}`
        : `${base}/events/${e.id}`;
      const regText = e.eventbrite_event_id ? "Register" : "Details";
      return `<div class="erow"><div class="edate" data-cms-field="events.start_at"><div class="em">${esc(month)}</div><div class="eday">${day}</div></div><div class="einfo"><h4 data-cms-field="events.name">${esc(e.name)}</h4><p>📍 <span data-cms-field="events.venue_name">${esc(e.venue_name || "TBA")}</span> · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p></div><div><a href="${esc(regUrl)}" class="btn-sm" target="_blank" rel="noopener" data-cms-field="events.url">${regText}</a></div></div>`;
    })
    .join("")}</div>`;
}

export { APP_URL };

/** Resolve a single CMS field value for data-cms-binding="collection.field" */
export function resolveCmsBinding(
  binding: string,
  cmsData: {
    featuredSermon: Record<string, unknown> | null;
    podcastConfig: Record<string, unknown> | null;
    podcastEpisodes: Array<Record<string, unknown>>;
    worshipRecordings: Array<Record<string, unknown>>;
    sermonArchive: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
  }
): string {
  if (!binding || !binding.includes(".")) return "";
  const [collection, field] = binding.split(".");
  if (!collection || !field) return "";

  const esc = (s: string) =>
    (s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  if (collection === "events") {
    const item = cmsData.events?.[0] as Record<string, unknown> | undefined;
    if (!item) return "";
    const v = item[field];
    if (field === "start_at") return fmtDate(v as string);
    if (field === "url" && item.eventbrite_event_id)
      return `https://www.eventbrite.com/e/${item.eventbrite_event_id}`;
    if (field === "url") return `${APP_URL.replace(/\/$/, "")}/events/${item.id}`;
    return String(v ?? "");
  }
  if (collection === "featured_sermon") {
    const item = cmsData.featuredSermon;
    if (!item) return "";
    return String((item[field] as string) ?? "");
  }
  if (collection === "podcast") {
    const item = cmsData.podcastConfig;
    if (!item) return "";
    return String((item[field] as string) ?? "");
  }
  if (collection === "worship_recordings") {
    const item = cmsData.worshipRecordings?.[0] as Record<string, unknown> | undefined;
    if (!item) return "";
    return String((item[field] as string) ?? "");
  }
  if (collection === "sermon_archive") {
    const item = cmsData.sermonArchive?.[0] as Record<string, unknown> | undefined;
    if (!item) return "";
    const v = item[field];
    if (field === "published_at") return fmtDate(v as string);
    return String((v as string) ?? "");
  }
  return "";
}
