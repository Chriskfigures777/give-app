import { NextResponse } from "next/server";

/**
 * Fetches an Auth0 access token using client credentials grant.
 * Use for server-side Auth0 Management API calls (e.g. user lookup, create user).
 *
 * For Unit banking: Unit needs the end-user's JWT (from Auth0 login), not this token.
 * Configure Unit JWT Settings with Auth0 JWKS if using Auth0 for banking users.
 */
export async function GET() {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const audience = process.env.AUTH0_AUDIENCE ?? `${domain}/api/v2/`;

  if (!domain || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Auth0 not configured. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const url = `${baseUrl.replace(/\/$/, "")}/oauth/token`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience,
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Auth0 token] Error:", response.status, err);
      return NextResponse.json(
        { error: "Failed to get Auth0 token", detail: err },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type ?? "Bearer",
    });
  } catch (error) {
    console.error("[Auth0 token] Error:", error);
    return NextResponse.json(
      { error: "Failed to get Auth0 token" },
      { status: 502 }
    );
  }
}
