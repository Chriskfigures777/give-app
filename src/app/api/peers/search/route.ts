import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/** GET: Search organizations for peer requests (org-to-org only) */
export async function GET(req: NextRequest) {
  try {
    const { supabase, profile } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

    let orgQuery = supabase
      .from("organizations")
      .select("id, name, slug")
      .not("stripe_connect_account_id", "is", null)
      .neq("id", orgId)
      .limit(limit);

    if (q.length >= 2) {
      const term = `%${q}%`;
      orgQuery = orgQuery.or(`name.ilike.${term},slug.ilike.${term}`);
    }

    const { data: orgs } = await orgQuery;
    const results = (orgs ?? []).map((o: { id: string; name: string; slug: string }) => ({
      id: o.id,
      type: "organization" as const,
      name: o.name,
      slug: o.slug,
    }));

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Peers search error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
