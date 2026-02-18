import { NextRequest, NextResponse } from "next/server";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET(req: NextRequest) {
  if (!PEXELS_API_KEY) {
    return NextResponse.json(
      { error: "Pexels API key not configured. Add PEXELS_API_KEY to .env.local" },
      { status: 503 }
    );
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(20, Math.max(1, parseInt(req.nextUrl.searchParams.get("per_page") ?? "20", 10)));

  if (!q) {
    return NextResponse.json({ photos: [], page: 1, per_page: perPage, total_results: 0 });
  }

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", q);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));

    const res = await fetch(url.toString(), {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: res.status === 429 ? "Rate limit exceeded" : err || "Pexels API error" },
        { status: res.status }
      );
    }

    const data = (await res.json()) as {
      photos?: Array<{
        id: number;
        url: string;
        src?: { original?: string; large2x?: string; medium?: string };
        photographer?: string;
      }>;
      page?: number;
      per_page?: number;
      total_results?: number;
    };

    const photos = (data.photos ?? []).map((p) => ({
      id: p.id,
      url: p.url,
      src: p.src?.original ?? p.src?.large2x ?? "",
      photographer: p.photographer ?? "",
    }));

    return NextResponse.json({
      photos,
      page: data.page ?? page,
      per_page: data.per_page ?? perPage,
      total_results: data.total_results ?? 0,
    });
  } catch (e) {
    console.error("pexels photos search error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
