import { NextRequest, NextResponse } from "next/server";
import {
  extractPexelsVideoId,
  extractPexelsPhotoId,
  isPexelsVideoUrl,
  isPexelsPhotoUrl,
} from "@/lib/pexels";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

/**
 * Resolves a Pexels video or photo page URL to a direct media URL.
 * POST body: { url: string, type?: "video" | "image" }
 * Returns: { mediaUrl: string, mediaType: "video" | "image" } or error
 */
export async function POST(req: NextRequest) {
  if (!PEXELS_API_KEY) {
    return NextResponse.json(
      { error: "Pexels API key not configured. Add PEXELS_API_KEY to .env.local and get a free key at https://www.pexels.com/api/" },
      { status: 503 }
    );
  }

  let body: { url?: string; type?: "video" | "image" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = (body.url ?? "").trim();
  if (!url) {
    return NextResponse.json({ error: "Missing url in body" }, { status: 400 });
  }

  const isVideo = body.type === "video" || isPexelsVideoUrl(url);
  const isPhoto = body.type === "image" || isPexelsPhotoUrl(url);

  if (isVideo) {
    const videoId = extractPexelsVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not extract video ID from URL. Use a Pexels video page like https://www.pexels.com/video/title-12345/" },
        { status: 400 }
      );
    }

    const res = await fetch(`https://api.pexels.com/videos/videos/${videoId}`, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: res.status === 404 ? "Video not found" : err || "Pexels API error" },
        { status: res.status }
      );
    }

    const data = (await res.json()) as {
      video_files?: Array< { link: string; quality?: string; file_type?: string } >;
    };
    const files = data.video_files ?? [];
    const mp4Files = files.filter((f) => f.file_type === "video/mp4" || f.link?.endsWith(".mp4"));
    const best = mp4Files.find((f) => f.quality === "hd") ?? mp4Files[0] ?? files[0];
    const mediaUrl = best?.link;

    if (!mediaUrl) {
      return NextResponse.json({ error: "No video file URL found" }, { status: 404 });
    }

    return NextResponse.json({ mediaUrl, mediaType: "video" as const });
  }

  if (isPhoto) {
    const photoId = extractPexelsPhotoId(url);
    if (!photoId) {
      return NextResponse.json(
        { error: "Could not extract photo ID from URL. Use a Pexels photo page like https://www.pexels.com/photo/title-12345/" },
        { status: 400 }
      );
    }

    const res = await fetch(`https://api.pexels.com/v1/photos/${photoId}`, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: res.status === 404 ? "Photo not found" : err || "Pexels API error" },
        { status: res.status }
      );
    }

    const data = (await res.json()) as { src?: { original?: string; large2x?: string } };
    const mediaUrl = data.src?.original ?? data.src?.large2x ?? null;

    if (!mediaUrl) {
      return NextResponse.json({ error: "No image URL found" }, { status: 404 });
    }

    return NextResponse.json({ mediaUrl, mediaType: "image" as const });
  }

  return NextResponse.json(
    { error: "URL must be a Pexels video or photo page (pexels.com/video/... or pexels.com/photo/...)" },
    { status: 400 }
  );
}
