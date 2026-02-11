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
