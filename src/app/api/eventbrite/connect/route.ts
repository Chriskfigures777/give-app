import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Initiates Eventbrite OAuth flow. Org admin must be logged in.
 * Query: organizationId (required)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const organizationId = req.nextUrl.searchParams.get("organizationId");
    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, owner_user_id")
      .eq("id", organizationId)
      .single();

    const org = orgRow as { id: string; owner_user_id: string | null } | null;
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const isOwner = org.owner_user_id === user.id;
    const { data: adminRow } = await supabase
      .from("organization_admins")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isPlatformAdmin = (profileRow as { role: string } | null)?.role === "platform_admin";

    if (!isPlatformAdmin && !isOwner && !adminRow) {
      return NextResponse.json(
        { error: "You don't have permission to manage this organization" },
        { status: 403 }
      );
    }

    const clientId = process.env.EVENTBRITE_CLIENT_ID;
    const redirectUri = process.env.EVENTBRITE_REDIRECT_URI?.trim();

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "Eventbrite is not configured. Set EVENTBRITE_CLIENT_ID and EVENTBRITE_REDIRECT_URI." },
        { status: 500 }
      );
    }

    const callbackUrl = redirectUri;

    const state = Buffer.from(
      JSON.stringify({
        organizationId,
        redirectTo: req.nextUrl.searchParams.get("redirectTo") ?? "/dashboard/events",
      })
    ).toString("base64url");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: callbackUrl,
      state,
    });

    const authUrl = `https://www.eventbrite.com/oauth/authorize?${params.toString()}`;

    return NextResponse.redirect(authUrl);
  } catch (e) {
    console.error("eventbrite/connect error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to connect Eventbrite" },
      { status: 500 }
    );
  }
}
