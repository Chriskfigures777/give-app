import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { verifyAuth0Token } from "@/lib/auth0/verify-token";

const UNIT_API_URL = process.env.UNIT_API_URL ?? "https://api.s.unit.sh";
const USE_AUTH0 = !!(process.env.NEXT_PUBLIC_AUTH0_DOMAIN && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID);

/**
 * Creates a Unit White-Label Application Form for the authenticated user.
 * When using Auth0: pass Authorization: Bearer <auth0-token>, jwtSubject = Auth0 sub.
 * Otherwise: uses Supabase session, jwtSubject = Supabase user id.
 */
export async function POST(req: NextRequest) {
  let jwtSubject: string;
  let tagsUserId: string;

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
    jwtSubject = auth0.sub;
    tagsUserId = auth0.sub;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated. Sign in at /login first." },
        { status: 401 }
      );
    }
    jwtSubject = user.id;
    tagsUserId = user.id;
  }

  const apiToken = process.env.UNIT_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ error: "Banking not configured" }, { status: 503 });
  }

  const idempotencyKey = randomUUID();

  const res = await fetch(`${UNIT_API_URL}/application-forms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/vnd.api+json",
      "X-Accept-Version": "V2024_06",
    },
    body: JSON.stringify({
      data: {
        type: "applicationForm",
        attributes: {
          idempotencyKey,
          tags: { userId: tagsUserId },
          jwtSubject,
        },
      },
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("[Unit create-application-form] status:", res.status, JSON.stringify(data, null, 2));
    const errMsg =
      data?.errors?.[0]?.detail ??
      data?.errors?.[0]?.title ??
      data?.error ??
      `Unit API error ${res.status}`;
    return NextResponse.json({ error: errMsg, unitErrors: data?.errors }, { status: 400 });
  }

  const formId = data?.data?.id;
  const tokenObj = data?.data?.attributes?.applicationFormToken;

  if (!formId || !tokenObj?.token) {
    return NextResponse.json(
      { error: "Invalid response from Unit", detail: data },
      { status: 500 }
    );
  }

  return NextResponse.json({
    applicationFormId: formId,
    applicationFormToken: tokenObj.token,
    expiration: tokenObj.expiration ?? tokenObj.expirationDate,
    link: data?.data?.links?.related?.href,
  });
}
