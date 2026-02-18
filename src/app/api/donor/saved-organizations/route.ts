import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export type SavedOrg = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  profile_image_url: string | null;
};

/** GET: List organizations saved by the current user (for feed sidebar, etc.) */
export async function GET() {
  try {
    const { supabase, user } = await requireAuth();

    const { data: savedRows, error } = await supabase
      .from("donor_saved_organizations")
      .select("organization_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Saved organizations GET error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const orgIds = (savedRows ?? []).map((r) => (r as { organization_id: string }).organization_id);
    if (orgIds.length === 0) {
      return NextResponse.json({ organizations: [] });
    }

    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug, logo_url, profile_image_url")
      .in("id", orgIds);

    if (orgError) {
      return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
    }

    const result: SavedOrg[] = (orgs ?? []).map((o) => ({
      id: (o as { id: string }).id,
      name: (o as { name: string }).name,
      slug: (o as { slug: string }).slug,
      logo_url: (o as { logo_url: string | null }).logo_url,
      profile_image_url: (o as { profile_image_url: string | null }).profile_image_url,
    }));

    return NextResponse.json({ organizations: result });
  } catch (e) {
    console.error("Saved organizations error:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
