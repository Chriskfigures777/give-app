import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** PATCH: Update the current user's personal profile (name + bio) */
export async function PATCH(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth();
    const body = await req.json();
    const { full_name, bio } = body as { full_name?: string; bio?: string };

    if (!full_name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({
        full_name: full_name.trim(),
        business_description: bio?.trim() ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
