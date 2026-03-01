import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UNIT_API_URL = process.env.UNIT_API_URL ?? "https://api.s.unit.sh";

/**
 * Exchanges the user's Supabase JWT for a Unit customer token.
 * The banking page calls this instead of using the raw Supabase JWT,
 * because unit-elements-white-label-app requires a Unit customer token.
 *
 * Flow:
 * 1. Get the user's Supabase session (access_token = their IdP JWT)
 * 2. Look up their Unit customer ID from user_profiles
 * 3. POST /customers/{id}/token with the Supabase JWT → get Unit customer token
 * 4. Return the Unit customer token to the banking page
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabaseJwt = session.access_token;

  // @ts-ignore – unit_customer_id not in generated types yet
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("unit_customer_id")
    .eq("id", session.user.id)
    .single();

  // @ts-ignore
  const unitCustomerId: string | null = profile?.unit_customer_id ?? null;

  if (!unitCustomerId) {
    return NextResponse.json({ error: "No banking account", hasCustomer: false }, { status: 404 });
  }

  const apiToken = process.env.UNIT_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ error: "Banking not configured" }, { status: 503 });
  }

  // Exchange the Supabase JWT for a Unit customer token
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
          jwtToken: supabaseJwt,
        },
      },
    }),
  });

  const unitData = await unitRes.json();

  if (!unitRes.ok) {
    const errMsg = unitData?.errors?.[0]?.detail ?? unitData?.errors?.[0]?.title ?? "Failed to get banking token";
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }

  const customerToken: string = unitData?.data?.attributes?.token;

  return NextResponse.json({ token: customerToken });
}
