/**
 * Server-side helper to get a donation-themed video URL for receipt hero.
 * Uses Pexels API when configured; falls back to curated URLs or image.
 */
import { DEFAULT_HEADER_IMAGE_URL, RECEIPT_VIDEO_URLS } from "@/lib/stock-media";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

/** In-memory cache for Pexels video URL (1 hour TTL). */
let cachedVideoUrl: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getReceiptVideoUrl(): Promise<{ url: string; isVideo: boolean }> {
  if (PEXELS_API_KEY) {
    try {
      if (cachedVideoUrl && Date.now() < cacheExpiry) {
        return { url: cachedVideoUrl, isVideo: true };
      }
      const res = await fetch(
        "https://api.pexels.com/videos/search?query=donation+giving+charity&per_page=1",
        { headers: { Authorization: PEXELS_API_KEY } }
      );
      if (res.ok) {
        const data = (await res.json()) as {
          videos?: Array<{
            video_files?: Array<{ link?: string; quality?: string; file_type?: string }>;
          }>;
        };
        const videos = data.videos ?? [];
        const first = videos[0];
        const files = first?.video_files ?? [];
        const mp4 = files.find((f) => f.file_type === "video/mp4" || f.link?.endsWith(".mp4"));
        const best = mp4 ?? files[0];
        const src = best?.link?.trim();
        if (src) {
          cachedVideoUrl = src;
          cacheExpiry = Date.now() + CACHE_TTL_MS;
          return { url: src, isVideo: true };
        }
      }
    } catch {
      // Fall through to curated/image
    }
  }

  if (RECEIPT_VIDEO_URLS.length > 0) {
    const idx = Math.floor(Date.now() / 3600000) % RECEIPT_VIDEO_URLS.length;
    const url = RECEIPT_VIDEO_URLS[idx] ?? RECEIPT_VIDEO_URLS[0];
    if (url) return { url, isVideo: true };
  }

  return { url: DEFAULT_HEADER_IMAGE_URL, isVideo: false };
}
