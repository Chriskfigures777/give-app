import { NextRequest, NextResponse } from "next/server";

function base64Decode(str: string): string {
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(str);
  }
  return Buffer.from(str, "base64").toString("utf-8");
}

/**
 * Debug: decode Auth0 JWT payload to verify iss, aud, sub for Unit config.
 * Call from browser console when on banking page:
 *   fetch('/api/unit/debug-auth0-jwt', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, credentials: 'include' }).then(r=>r.json()).then(console.log)
 * Or use the token from DevTools → Application → Local Storage (Auth0 cache).
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json(
      { error: "Send Authorization: Bearer <auth0-token>" },
      { status: 400 }
    );
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return NextResponse.json({ error: "Invalid JWT format" }, { status: 400 });
    }
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = base64Decode(base64);
    const payload = JSON.parse(decoded);
    return NextResponse.json({
      iss: payload.iss,
      aud: payload.aud,
      sub: payload.sub,
      exp: payload.exp,
      hint: "Unit Issuer must match 'iss' exactly (including https:// and trailing /)",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to decode JWT";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
