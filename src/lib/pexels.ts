/**
 * Utilities for resolving Pexels page URLs to direct media URLs.
 * Pexels video/photo pages are not direct media URLs; we use the Pexels API to get the actual file.
 */

/** Extract video ID from Pexels video URL: pexels.com/video/title-12345/ */
export function extractPexelsVideoId(url: string): number | null {
  const match = url.match(/pexels\.com\/video\/[^/]+-(\d+)\/?/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Extract photo ID from Pexels photo URL: pexels.com/photo/title-12345/ */
export function extractPexelsPhotoId(url: string): number | null {
  const match = url.match(/pexels\.com\/photo\/[^/]+-(\d+)\/?/i);
  return match ? parseInt(match[1], 10) : null;
}

export function isPexelsVideoUrl(url: string): boolean {
  return /pexels\.com\/video\//i.test(url?.trim() ?? "");
}

export function isPexelsPhotoUrl(url: string): boolean {
  return /pexels\.com\/photo\//i.test(url?.trim() ?? "");
}

export function isPexelsUrl(url: string): boolean {
  return isPexelsVideoUrl(url) || isPexelsPhotoUrl(url);
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export type PexelsVideoResolved = {
  mp4Url: string;
  thumbnailUrl: string | null;
};

/**
 * Resolves a Pexels video page URL to direct MP4 URL and video screenshot/thumbnail.
 * Returns null if URL is not a Pexels video, API key is missing, or resolution fails.
 */
export async function resolvePexelsVideo(url: string): Promise<PexelsVideoResolved | null> {
  const trimmed = (url ?? "").trim();
  if (!trimmed || !isPexelsVideoUrl(trimmed)) return null;
  if (!PEXELS_API_KEY) return null;

  const videoId = extractPexelsVideoId(trimmed);
  if (!videoId) return null;

  try {
    const res = await fetch(`https://api.pexels.com/videos/videos/${videoId}`, {
      headers: { Authorization: PEXELS_API_KEY },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      video_files?: Array<{ link: string; quality?: string; file_type?: string }>;
      image?: string;
      video_pictures?: Array<{ picture: string }>;
    };
    const files = data.video_files ?? [];
    const mp4Files = files.filter((f) => f.file_type === "video/mp4" || f.link?.endsWith(".mp4"));
    const best = mp4Files.find((f) => f.quality === "hd") ?? mp4Files[0] ?? files[0];
    const mp4Url = best?.link ?? null;
    if (!mp4Url) return null;

    const thumbnailUrl =
      data.image ?? data.video_pictures?.[0]?.picture ?? null;

    return { mp4Url, thumbnailUrl };
  } catch {
    return null;
  }
}

/**
 * Resolves a Pexels video page URL to a direct MP4 URL only.
 * @deprecated Prefer resolvePexelsVideo() for thumbnail support.
 */
export async function resolvePexelsVideoToMp4(url: string): Promise<string | null> {
  const result = await resolvePexelsVideo(url);
  return result?.mp4Url ?? null;
}
