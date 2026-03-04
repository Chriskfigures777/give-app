import { NextRequest, NextResponse } from "next/server";

/**
 * Plaid OAuth Callback
 *
 * Plaid redirects here after the user completes OAuth at their bank (for institutions
 * that require OAuth, e.g. Chase, Bank of America). Add this URL to Plaid Dashboard
 * → API → Allowed redirect URIs.
 *
 * Localhost: http://localhost:3000/api/plaid/callback
 * Production: https://your-domain.com/api/plaid/callback
 *
 * @see https://plaid.com/docs/link/oauth
 */
export async function GET(req: NextRequest) {
  const linkSessionId = req.nextUrl.searchParams.get("link_session_id");
  const oauthStateId = req.nextUrl.searchParams.get("oauth_state_id");

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : req.nextUrl.origin);

  // Redirect to dashboard where Plaid Link can re-open with session
  const redirectTo = "/dashboard";
  const redirectUrl = new URL(redirectTo, baseUrl);

  if (linkSessionId) {
    redirectUrl.searchParams.set("link_session_id", linkSessionId);
  }
  if (oauthStateId) {
    redirectUrl.searchParams.set("oauth_state_id", oauthStateId);
  }

  return NextResponse.redirect(redirectUrl);
}
