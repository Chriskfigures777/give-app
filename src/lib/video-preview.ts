/**
 * Unified video preview resolution for CMS sermon thumbnails.
 * Supports Pexels, YouTube, direct MP4, and other video URLs.
 */

import { resolvePexelsVideo, isPexelsVideoUrl } from "./pexels";

export type VideoPreviewResult =
  | { type: "mp4"; mp4Url: string; thumbnailUrl: string | null }
  | { type: "youtube"; embedUrl: string; thumbnailUrl: string }
  | null;

/** Extract YouTube video ID from various URL formats */
export function extractYouTubeVideoId(url: string): string | null {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return null;
  // youtube.com/watch?v=ID
  const watch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  return watch ? watch[1] : null;
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url?.trim() ?? "");
}

export function isDirectMp4Url(url: string): boolean {
  const u = (url ?? "").trim().toLowerCase();
  return u.endsWith(".mp4") || u.includes(".mp4?");
}

/** Extract Vimeo video ID from URL */
export function extractVimeoVideoId(url: string): string | null {
  const trimmed = (url ?? "").trim();
  const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match ? match[1] : null;
}

export function isVimeoUrl(url: string): boolean {
  return /vimeo\.com/i.test(url?.trim() ?? "");
}

/**
 * Resolves any video URL to preview data (MP4 or embed + thumbnail).
 * Supports: Pexels, YouTube, Vimeo, direct MP4.
 * Returns null for unsupported URLs or on resolution failure.
 */
export async function resolveVideoPreview(url: string): Promise<VideoPreviewResult | null> {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return null;

  // Direct MP4 - use as-is, no thumbnail from URL
  if (isDirectMp4Url(trimmed)) {
    return { type: "mp4", mp4Url: trimmed, thumbnailUrl: null };
  }

  // YouTube - thumbnail from img.youtube.com, embed for hover
  if (isYouTubeUrl(trimmed)) {
    const videoId = extractYouTubeVideoId(trimmed);
    if (!videoId) return null;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
    return { type: "youtube", embedUrl, thumbnailUrl };
  }

  // Vimeo - oEmbed for thumbnail, embed for hover
  if (isVimeoUrl(trimmed)) {
    const videoId = extractVimeoVideoId(trimmed);
    if (!videoId) return null;
    const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return { type: "youtube", embedUrl, thumbnailUrl: "" };
      const data = (await res.json()) as { thumbnail_url?: string };
      const thumbnailUrl = data.thumbnail_url ?? "";
      return { type: "youtube", embedUrl, thumbnailUrl };
    } catch {
      return { type: "youtube", embedUrl, thumbnailUrl: "" };
    }
  }

  // Pexels - resolve via API
  if (isPexelsVideoUrl(trimmed)) {
    const result = await resolvePexelsVideo(trimmed);
    if (!result?.mp4Url) return null;
    return { type: "mp4", mp4Url: result.mp4Url, thumbnailUrl: result.thumbnailUrl };
  }

  return null;
}
