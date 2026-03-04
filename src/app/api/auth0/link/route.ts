import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyAuth0Token } from "@/lib/auth0/verify-token";

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Links Auth0 user to Supabase user. Call when user has both sessions.
 * Stores auth0_user_id on user_profiles so webhook can match customer.created.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization: Bearer <auth0-token>" }, { status: 401 });
    }

    const auth0 = await verifyAuth0Token(token);
    if (!auth0) {
      return NextResponse.json({ error: "Invalid Auth0 token" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated with Supabase" }, { status: 401 });
    }

    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Service client failed";
      console.error("[auth0/link]", msg);
      return NextResponse.json(
        { error: "Server misconfigured", detail: IS_DEV ? msg : undefined },
        { status: 500 }
      );
    }

    const { data: existing } = await serviceClient
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existing) {
      const { error } = await serviceClient
        .from("user_profiles")
        // @ts-ignore – auth0_user_id added by migration
        .update({ auth0_user_id: auth0.sub })
        .eq("id", user.id);
      if (error) {
        console.error("[auth0/link] Failed to update auth0_user_id", user.id, error);
        return NextResponse.json(
          { error: "Failed to link", detail: IS_DEV ? error.message : undefined },
          { status: 500 }
        );
      }
    } else {
      const { error } = await serviceClient
        .from("user_profiles")
        // @ts-ignore – auth0_user_id added by migration
        .insert({ id: user.id, auth0_user_id: auth0.sub, role: "donor" });
      if (error) {
        console.error("[auth0/link] Failed to insert user_profile", user.id, error);
        return NextResponse.json(
          { error: "Failed to link", detail: IS_DEV ? error.message : undefined },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ linked: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auth0/link] Unexpected error", e);
    return NextResponse.json(
      { error: "Internal error", detail: IS_DEV ? msg : undefined },
      { status: 500 }
    );
  }
}
