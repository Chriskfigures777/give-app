import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

const BUCKET = "org-assets";

async function canAccessOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data: org } = await supabase
    .from("organizations")
    .select("owner_user_id")
    .eq("id", orgId)
    .single();
  if ((org as { owner_user_id?: string } | null)?.owner_user_id === userId) return true;
  const { data: admin } = await supabase
    .from("organization_admins")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!admin;
}

/**
 * Extract storage path from a public URL.
 * URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
 */
function pathFromPublicUrl(url: string, bucket: string): string | null {
  try {
    const u = new URL(url);
    const pathMatch = u.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`));
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Verify the path is under {orgId}/website-builder/
 */
function isOrgWebsiteBuilderPath(path: string, orgId: string): boolean {
  const prefix = `${orgId}/website-builder/`;
  return path.startsWith(prefix);
}

export async function DELETE(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    if (!orgId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin") {
      const canAccess = await canAccessOrg(supabase, user.id, orgId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { assets } = body as { assets?: { src: string }[] };

    if (!Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json({ error: "assets array required" }, { status: 400 });
    }

    const pathsToDelete: string[] = [];
    for (const a of assets) {
      const src = a?.src;
      if (!src || typeof src !== "string") continue;

      const path = pathFromPublicUrl(src, BUCKET);
      if (!path) continue;

      if (profile?.role !== "platform_admin" && !isOrgWebsiteBuilderPath(path, orgId)) {
        return NextResponse.json({ error: "Forbidden: asset does not belong to your organization" }, { status: 403 });
      }

      pathsToDelete.push(path);
    }

    if (pathsToDelete.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase.storage.from(BUCKET).remove(pathsToDelete);

    if (error) {
      console.error("website-builder-assets DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("website-builder-assets DELETE error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
