import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyAuth0Token } from "@/lib/auth0/verify-token";

const UNIT_API_URL = process.env.UNIT_API_URL ?? "https://api.s.unit.sh";
const USE_AUTH0 = !!(process.env.NEXT_PUBLIC_AUTH0_DOMAIN && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID);

// Prevent static optimization/caching — this route returns user-specific tokens
export const dynamic = "force-dynamic";

/**
 * Exchanges the user's JWT (Supabase or Auth0) for a Unit customer token.
 * The white-label app requires a Unit customer token, not the raw IdP JWT.
 *
 * Flow:
 * 1. Get the user's JWT (Supabase session or Auth0 Bearer token)
 * 2. Look up their Unit customer ID from user_profiles
 * 3. POST /customers/{id}/token with the JWT → get Unit customer token
 * 4. Return the Unit customer token to the banking page
 */
export async function GET(req: NextRequest) {
  let jwtForUnit: string;
  let unitCustomerId: string | null = null;

  if (USE_AUTH0) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization: Bearer <auth0-token>" }, { status: 401 });
    }
    const auth0 = await verifyAuth0Token(token);
    if (!auth0) {
      return NextResponse.json({ error: "Invalid Auth0 token" }, { status: 401 });
    }
    jwtForUnit = token;

    const serviceClient = createServiceClient();
    // @ts-ignore – auth0_user_id, unit_customer_id
    let { data: profile } = await serviceClient
      .from("user_profiles")
      .select("unit_customer_id, auth0_user_id")
      .eq("auth0_user_id", auth0.sub)
      .maybeSingle();

    // When Unit is configured for Auth0 (JWKS), we must ONLY send Auth0 tokens.
    // Do NOT fall back to Supabase JWT — Unit cannot verify it (kid mismatch: "No key found in jwks.json").
    // If profile has unit_customer_id but auth0_user_id doesn't match, ensure /api/auth0/link has run
    // to set auth0_user_id, or the customer was created with Auth0 from the start.
    unitCustomerId = (profile as { unit_customer_id?: string } | null)?.unit_customer_id ?? null;
  } else {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    const supabaseJwt = session?.access_token;

    if (!supabaseJwt) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    jwtForUnit = supabaseJwt;

    // @ts-ignore – unit_customer_id
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("unit_customer_id")
      .eq("id", user.id)
      .single();

    unitCustomerId = (profile as { unit_customer_id?: string } | null)?.unit_customer_id ?? null;
  }

  if (!unitCustomerId) {
    return NextResponse.json({ error: "No banking account", hasCustomer: false }, { status: 404 });
  }

  const apiToken = process.env.UNIT_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ error: "Banking not configured" }, { status: 503 });
  }

  // Exchange the JWT for a Unit customer token
  const unitRes = await fetch(`${UNIT_API_URL}/customers/${unitCustomerId}/token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "customerToken",
        attributes: {
          scope: "customers accounts payments payments-write cards cards-write counterparties",
          jwtToken: jwtForUnit,
        },
      },
    }),
  });

  const unitData = await unitRes.json();

  if (!unitRes.ok) {
    const unitErr = unitData?.errors?.[0];
    const errMsg = unitErr?.detail ?? unitErr?.title ?? "Failed to get banking token";
    const errCode = unitErr?.code;
    // Log for debugging (e.g. "jwtSettings was not found", JWT validation failures)
    console.error("[customer-token] Unit API error:", unitRes.status, unitData);
    return NextResponse.json(
      { error: errMsg, unitErrorCode: errCode },
      { status: 400 }
    );
  }

  const customerToken: string = unitData?.data?.attributes?.token;

  return NextResponse.json({ token: customerToken });
}
