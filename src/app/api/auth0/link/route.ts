import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyAuth0Token } from "@/lib/auth0/verify-token";

/**
 * Links Auth0 user to Supabase user. Call when user has both sessions.
 * Stores auth0_user_id on user_profiles so webhook can match customer.created.
 */
export async function POST(req: NextRequest) {
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

  const serviceClient = createServiceClient();
  const { data: existing } = await serviceClient
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existing) {
    const { error } = await serviceClient
      .from("user_profiles")
      // @ts-ignore
      .update({ auth0_user_id: auth0.sub })
      .eq("id", user.id);
    if (error) {
      console.error("[auth0/link] Failed to update auth0_user_id", user.id, error);
      return NextResponse.json({ error: "Failed to link" }, { status: 500 });
    }
  } else {
    const { error } = await serviceClient
      .from("user_profiles")
      // @ts-ignore
      .insert({ id: user.id, auth0_user_id: auth0.sub, role: "donor" });
    if (error) {
      console.error("[auth0/link] Failed to insert user_profile", user.id, error);
      return NextResponse.json({ error: "Failed to link" }, { status: 500 });
    }
  }

  return NextResponse.json({ linked: true });
}
