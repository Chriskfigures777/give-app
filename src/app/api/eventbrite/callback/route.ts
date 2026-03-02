import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  exchangeEventbriteCode,
  getEventbriteOrgId,
} from "@/lib/eventbrite/client";

/**
 * Eventbrite OAuth callback. Exchanges code for tokens and stores on organization.
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
      console.error("Eventbrite OAuth error:", error);
      const redirectTo = "/dashboard/events";
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state from Eventbrite" },
        { status: 400 }
      );
    }

    let payload: { organizationId: string; redirectTo: string };
    try {
      payload = JSON.parse(
        Buffer.from(state, "base64url").toString("utf-8")
      ) as { organizationId: string; redirectTo: string };
    } catch {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    const redirectUri = process.env.EVENTBRITE_REDIRECT_URI;
    if (!redirectUri) {
      return NextResponse.json(
        { error: "EVENTBRITE_REDIRECT_URI not configured" },
        { status: 500 }
      );
    }

    const { accessToken, refreshToken } = await exchangeEventbriteCode(
      code,
      redirectUri
    );

    const { orgId: eventbriteOrgId } = await getEventbriteOrgId(accessToken);

    const supabase = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("organizations")
      .update({
        eventbrite_org_id: eventbriteOrgId,
        eventbrite_access_token: accessToken,
        eventbrite_refresh_token: refreshToken ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.organizationId);

    if (updateError) {
      console.error("Failed to store Eventbrite tokens:", updateError);
      return NextResponse.json(
        { error: "Failed to save Eventbrite connection" },
        { status: 500 }
      );
    }

    const redirectTo = payload.redirectTo || "/dashboard/events";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : req.nextUrl.origin);

    return NextResponse.redirect(new URL(redirectTo, baseUrl));
  } catch (e) {
    console.error("eventbrite/callback error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Eventbrite connection failed" },
      { status: 500 }
    );
  }
}
