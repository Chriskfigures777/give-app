import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const GODADDY_API = "https://api.godaddy.com";

type AvailabilityResult = {
  available: boolean;
  currency: string;
  definitive: boolean;
  domain: string;
  period: number;
  price: number;
};

function getGodaddyHeaders() {
  const key = process.env.GODADDY_API_KEY;
  const secret = process.env.GODADDY_API_SECRET;
  if (!key || !secret) return null;
  return {
    Authorization: `sso-key ${key}:${secret}`,
    "Content-Type": "application/json",
  };
}

async function checkSingle(
  domain: string,
  headers: Record<string, string>
): Promise<AvailabilityResult | null> {
  try {
    const res = await fetch(
      `${GODADDY_API}/v1/domains/available?domain=${encodeURIComponent(domain)}&checkType=FAST`,
      { headers }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** GET /api/domains/search?q=example */
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const query = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query required (min 2 chars)" },
        { status: 400 }
      );
    }

    const headers = getGodaddyHeaders();
    if (!headers) {
      return NextResponse.json(
        { error: "Domain search not configured" },
        { status: 503 }
      );
    }

    const hasTld = /\.\w{2,}$/.test(query);
    const baseName = hasTld ? query.replace(/\.\w+$/, "") : query;
    const primaryDomain = hasTld ? query : `${query}.com`;

    const domainsToCheck = [primaryDomain];
    const tlds = [".com", ".org", ".net", ".church", ".community"];
    for (const tld of tlds) {
      const d = baseName + tld;
      if (!domainsToCheck.includes(d)) domainsToCheck.push(d);
    }

    // Try bulk endpoint first
    const availRes = await fetch(
      `${GODADDY_API}/v1/domains/available?checkType=FAST`,
      { method: "POST", headers, body: JSON.stringify(domainsToCheck) }
    );

    if (availRes.ok) {
      const data = await availRes.json();
      const allResults: AvailabilityResult[] = Array.isArray(data?.domains)
        ? data.domains
        : Array.isArray(data)
          ? data
          : [data];

      const results = allResults
        .filter((r) => r.available)
        .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

      return NextResponse.json({ results });
    }

    // Fall back to checking individually (rate limited, so check top 4)
    const topDomains = domainsToCheck.slice(0, 4);
    const checks = await Promise.all(
      topDomains.map((d) => checkSingle(d, headers))
    );
    const allChecks = checks.filter(
      (r): r is AvailabilityResult => r !== null
    );

    if (allChecks.length > 0) {
      const results = allChecks
        .filter((r) => r.available)
        .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      return NextResponse.json({ results });
    }

    // Fallback suggestions
    const fallbackResults = domainsToCheck.map((d) => ({
      domain: d,
      available: false,
      price: 0,
      currency: "USD",
      period: 1,
      definitive: false,
    }));

    return NextResponse.json({
      results: fallbackResults,
      note: "Live availability check unavailable. Visit a domain registrar to verify.",
    });
  } catch (e) {
    console.error("domains/search error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
