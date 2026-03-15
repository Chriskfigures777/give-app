import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** GET: Search orgs AND individual members for peer connections */
export async function GET(req: NextRequest) {
  try {
    const { supabase, profile, user } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

    const results: {
      id: string;
      type: "organization" | "user";
      name: string;
      slug?: string;
      role?: string;
      avatar_url?: string | null;
    }[] = [];

    // 1. Search organizations
    let orgQuery = supabase
      .from("organizations")
      .select("id, name, slug, logo_url")
      .not("stripe_connect_account_id", "is", null)
      .limit(limit);

    if (orgId) {
      orgQuery = orgQuery.neq("id", orgId);
    }

    if (q.length >= 2) {
      const term = `%${q}%`;
      orgQuery = orgQuery.or(`name.ilike.${term},slug.ilike.${term}`);
    }

    const { data: orgs } = await orgQuery;
    for (const o of orgs ?? []) {
      const org = o as { id: string; name: string; slug: string; logo_url: string | null };
      results.push({
        id: org.id,
        type: "organization",
        name: org.name,
        slug: org.slug,
        avatar_url: org.logo_url,
      });
    }

    // 2. Search individual users (donors, members, missionaries, org admins)
    let userQuery = supabase
      .from("user_profiles")
      .select("id, full_name, email, role, avatar_url")
      .neq("id", user.id)
      .limit(limit);

    if (q.length >= 2) {
      const term = `%${q}%`;
      userQuery = userQuery.or(`full_name.ilike.${term},email.ilike.${term}`);
    }

    const { data: users } = await userQuery;
    for (const u of users ?? []) {
      const up = u as {
        id: string;
        full_name: string | null;
        email: string | null;
        role: string;
        avatar_url: string | null;
      };
      const displayName = up.full_name?.trim() || up.email?.split("@")[0] || null;
      if (!displayName) continue;
      results.push({
        id: up.id,
        type: "user",
        name: displayName,
        role: up.role,
        avatar_url: up.avatar_url,
      });
    }

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Peers search error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
