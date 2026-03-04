import { NextRequest, NextResponse } from "next/server";

/**
 * Astra OAuth Callback
 *
 * Astra redirects here after the user completes auth (e.g. COLLECT_AUTHORIZATION,
 * LINK_CARD) in the Astra Web SDK. The redirect_uri must match exactly what you
 * configure in Astra Developer Dashboard.
 *
 * Configure in Astra Dashboard → Developer Account settings:
 * - Sandbox: https://dashboard-sandbox.astra.finance/
 * - Production: https://dashboard.astra.finance/
 *
 * Query params from Astra: code, state (and optionally error, error_description)
 * The code is a short-lived token to exchange for an access_token via Astra API.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const errorDescription = req.nextUrl.searchParams.get("error_description");

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : req.nextUrl.origin);

  // Default redirect after callback
  const defaultRedirect = "/dashboard";

  if (error) {
    console.error("[astra-callback] OAuth error:", error, errorDescription);
    const redirectUrl = new URL(defaultRedirect, baseUrl);
    redirectUrl.searchParams.set("astra_error", error);
    if (errorDescription) redirectUrl.searchParams.set("astra_error_description", errorDescription);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    const redirectUrl = new URL(defaultRedirect, baseUrl);
    redirectUrl.searchParams.set("astra_error", "missing_code");
    return NextResponse.redirect(redirectUrl);
  }

  // Parse state for custom redirect path (e.g. base64-encoded { redirectTo: "/dashboard/banking" })
  let redirectTo = defaultRedirect;
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf-8")) as {
        redirectTo?: string;
      };
      if (decoded?.redirectTo && decoded.redirectTo.startsWith("/")) {
        redirectTo = decoded.redirectTo;
      }
    } catch {
      // state is opaque, use default
    }
  }

  // Pass code to client via query (short-lived; client should exchange immediately)
  // Or store in httpOnly cookie - for now we redirect with code so client can exchange
  const redirectUrl = new URL(redirectTo, baseUrl);
  redirectUrl.searchParams.set("astra_code", code);
  if (state) redirectUrl.searchParams.set("astra_state", state);

  return NextResponse.redirect(redirectUrl);
}
