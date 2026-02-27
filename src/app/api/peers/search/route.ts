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
    }[] = [];

    // 1. Search organizations (only if caller has an org context OR is searching broadly)
    let orgQuery = supabase
      .from("organizations")
      .select("id, name, slug")
      .not("stripe_connect_account_id", "is", null)
      .limit(limit);

    // Exclude caller's own org
    if (orgId) {
      orgQuery = orgQuery.neq("id", orgId);
    }

    if (q.length >= 2) {
      const term = `%${q}%`;
      orgQuery = orgQuery.or(`name.ilike.${term},slug.ilike.${term}`);
    }

    const { data: orgs } = await orgQuery;
    for (const o of orgs ?? []) {
      const org = o as { id: string; name: string; slug: string };
      results.push({ id: org.id, type: "organization", name: org.name, slug: org.slug });
    }

    // 2. Search individual users (donors, members, missionaries)
    let userQuery = supabase
      .from("user_profiles")
      .select("id, full_name, role")
      .neq("id", user.id) // exclude self
      .not("full_name", "is", null)
      .limit(limit);

    if (q.length >= 2) {
      const term = `%${q}%`;
      userQuery = userQuery.ilike("full_name", term);
    }

    const { data: users } = await userQuery;
    for (const u of users ?? []) {
      const up = u as { id: string; full_name: string; role: string };
      if (!up.full_name?.trim()) continue;
      results.push({
        id: up.id,
        type: "user",
        name: up.full_name,
        role: up.role,
      });
    }

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Peers search error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
