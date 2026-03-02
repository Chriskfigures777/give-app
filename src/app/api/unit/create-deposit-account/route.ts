import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";

const UNIT_API_URL = process.env.UNIT_API_URL ?? "https://api.s.unit.sh";

export const dynamic = "force-dynamic";

/**
 * Creates a Unit deposit account for the authenticated user.
 * Uses Supabase session (cookies) or Authorization: Bearer <supabase-jwt> for curl.
 *
 * Usage with curl (get JWT from /api/unit/debug-jwt while logged in):
 *   curl -X POST 'http://localhost:3000/api/unit/create-deposit-account' \
 *     -H 'Content-Type: application/json' \
 *     -H 'Authorization: Bearer YOUR_SUPABASE_JWT' \
 *     -d '{"depositProduct": "checking"}'
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  let userId: string | null = null;

  // 1. Try session from cookies (browser / fetch with credentials)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    userId = user.id;
  }

  // 2. Fallback: Authorization Bearer (Supabase JWT) for curl
  if (!userId) {
    const authHeader = (await headers()).get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (bearerToken) {
      const { data: { user: userFromJwt } } = await supabase.auth.getUser(bearerToken);
      if (userFromJwt) {
        userId = userFromJwt.id;
      }
    }
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Not authenticated. Sign in at /login first, or pass Authorization: Bearer <supabase-jwt>." },
      { status: 401 }
    );
  }

  const apiToken = process.env.UNIT_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ error: "Banking not configured" }, { status: 503 });
  }

  // Get user's Unit customer ID
  let body: { depositProduct?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const depositProduct = body.depositProduct ?? "checking";

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("unit_customer_id")
    .eq("id", userId)
    .single();

  // @ts-ignore
  const unitCustomerId: string | null = profile?.unit_customer_id ?? null;

  if (!unitCustomerId) {
    return NextResponse.json(
      { error: "No banking account", hasCustomer: false },
      { status: 404 }
    );
  }

  const unitRes = await fetch(`${UNIT_API_URL}/accounts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "depositAccount",
        attributes: {
          depositProduct,
          tags: { purpose: depositProduct },
          idempotencyKey: randomUUID(),
        },
        relationships: {
          customer: {
            data: { type: "customer", id: unitCustomerId },
          },
        },
      },
    }),
  });

  const unitData = await unitRes.json();

  if (!unitRes.ok) {
    const errMsg =
      unitData?.errors?.[0]?.detail ??
      unitData?.errors?.[0]?.title ??
      `Unit API error ${unitRes.status}`;
    return NextResponse.json(
      { error: errMsg, unitErrors: unitData?.errors },
      { status: 400 }
    );
  }

  return NextResponse.json({
    accountId: unitData?.data?.id,
    account: unitData?.data,
  });
}
