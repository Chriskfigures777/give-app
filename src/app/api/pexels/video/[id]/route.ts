import { NextRequest, NextResponse } from "next/server";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

/**
 * GET /api/pexels/video/:id
 * Resolves a Pexels video ID to a direct MP4 URL + thumbnail.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!PEXELS_API_KEY) {
    return NextResponse.json({ error: "Pexels API key not configured" }, { status: 503 });
  }

  const videoId = parseInt(id, 10);
  if (!videoId || isNaN(videoId)) {
    return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.pexels.com/videos/videos/${videoId}`, {
      headers: { Authorization: PEXELS_API_KEY },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Pexels API error" }, { status: res.status });
    }

    const data = (await res.json()) as {
      video_files?: Array<{ link: string; quality?: string; file_type?: string; width?: number; height?: number }>;
      image?: string;
      video_pictures?: Array<{ picture: string }>;
    };

    const files = data.video_files ?? [];
    const mp4Files = files.filter(
      (f) => f.file_type === "video/mp4" || f.link?.endsWith(".mp4")
    );

    // Prefer HD (720p+) file for background use
    const hd = mp4Files.find((f) => f.quality === "hd" && (f.width ?? 0) >= 1280);
    const best = hd ?? mp4Files.find((f) => f.quality === "hd") ?? mp4Files[0] ?? files[0];
    const mp4Url = best?.link ?? null;

    const thumbnailUrl = data.image ?? data.video_pictures?.[0]?.picture ?? null;

    return NextResponse.json(
      { mp4Url, thumbnailUrl },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    );
  } catch (e) {
    console.error("pexels video fetch error:", e);
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
  }
}
