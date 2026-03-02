import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/** POST: Convert giver to missionary (sets role and plans_to_be_missionary) */
export async function POST() {
  try {
    const { user, profile, supabase } = await requireAuth();

    if (profile?.role === "organization_admin" || profile?.role === "platform_admin") {
      return NextResponse.json({ error: "Organization accounts cannot convert to missionary" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({
        role: "missionary",
        plans_to_be_missionary: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
