import { headers } from "next/headers";
import { env } from "@/env";

/**
 * Derives the request origin from headers (e.g. when user visits https://versa.com/dashboard).
 * Use this for baseUrl in server components so live previews and embeds load from the actual
 * domain instead of localhost when the app is accessed via a custom domain.
 */
export async function getRequestOrigin(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
    const proto =
      headersList.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");
    if (host) {
      const origin = `${proto}://${host}`.replace(/\/$/, "");
      if (origin.startsWith("http")) return origin;
    }
  } catch {
    // headers() can throw in some contexts (e.g. static export)
  }
  return "";
}

/**
 * Base URL for dashboard pages (live preview, embed codes, etc.).
 * Prefers the request origin so previews work when accessed via custom domain.
 * Never returns a localhost URL — embed codes and preview links must be publicly accessible.
 */
export async function getBaseUrlForDashboard(): Promise<string> {
  const origin = await getRequestOrigin();
  const isLocalhost =
    origin.includes("localhost") || origin.includes("127.0.0.1");
  if (origin && origin.startsWith("http") && !isLocalhost) {
    return origin.replace(/\/$/, "");
  }
  return env.app.domain().replace(/\/$/, "");
}
