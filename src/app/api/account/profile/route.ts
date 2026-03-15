import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const ALLOWED_ROLES = ["donor", "missionary", "member", "organization_admin"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

function isAllowedRole(r: unknown): r is AllowedRole {
  return ALLOWED_ROLES.includes(r as AllowedRole);
}

/** PATCH: Update the current user's personal profile (name, bio, role) */
export async function PATCH(req: NextRequest) {
  try {
    const { supabase, user, profile } = await requireAuth();
    const body = await req.json();
    const { full_name, bio, role } = body as {
      full_name?: string;
      bio?: string;
      role?: string;
    };

    if (!full_name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Prevent non-platform-admins from escalating to platform_admin
    const newRole =
      role && isAllowedRole(role) && profile?.role !== "platform_admin"
        ? role
        : profile?.role ?? undefined;

    const updatePayload: Record<string, unknown> = {
      full_name: full_name.trim(),
      business_description: bio?.trim() ?? null,
      updated_at: new Date().toISOString(),
    };

    if (newRole) {
      updatePayload.role = newRole;
    }

    const { error } = await supabase
      .from("user_profiles")
      .update(updatePayload)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
