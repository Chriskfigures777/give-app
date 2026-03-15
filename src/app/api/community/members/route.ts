import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const MAX_LIMIT = 48;
const DEFAULT_LIMIT = 24;
const MAX_Q = 200;

function sanitize(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[\x00-\x1f\x7f]/g, "").slice(0, MAX_Q).trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = sanitize(searchParams.get("q"));
    const type = searchParams.get("type") ?? "all"; // all | people | organization
    const role = sanitize(searchParams.get("role")); // church | nonprofit | missionary | donor | member
    const limit = Math.min(parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

    // Require authentication so only logged-in users can discover other members
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ results: [], total: 0 });
    }

    // Use service client for user_profiles to bypass RLS (which restricts users to their own row)
    const serviceSupabase = createServiceClient();

    type OrgItem = {
      kind: "org";
      id: string;
      name: string;
      slug: string;
      org_type: string | null;
      city: string | null;
      state: string | null;
      logo_url: string | null;
      profile_image_url: string | null;
      description: string | null;
    };

    type UserItem = {
      kind: "user";
      id: string;
      name: string;
      role: string;
      bio: string | null;
    };

    const results: Array<OrgItem | UserItem> = [];

    // ── Organizations ──────────────────────────────────────────────
    if (type === "all" || type === "organization") {
      let orgQ = supabase
        .from("organizations")
        .select("id, name, slug, org_type, city, state, logo_url, profile_image_url, description")
        .eq("page_published", true)
        .not("stripe_connect_account_id", "is", null)
        .order("name")
        .range(offset, offset + limit - 1);

      if (role && ["church", "nonprofit", "missionary"].includes(role)) {
        orgQ = orgQ.eq("org_type", role);
      }

      if (q.length >= 2) {
        const term = `%${q}%`;
        orgQ = orgQ.or(`name.ilike.${term},description.ilike.${term},city.ilike.${term}`);
      }

      const { data: orgs } = await orgQ;
      for (const o of orgs ?? []) {
        const row = o as {
          id: string;
          name: string;
          slug: string;
          org_type: string | null;
          city: string | null;
          state: string | null;
          logo_url: string | null;
          profile_image_url: string | null;
          description: string | null;
        };
        results.push({
          kind: "org",
          id: row.id,
          name: row.name,
          slug: row.slug,
          org_type: row.org_type,
          city: row.city,
          state: row.state,
          logo_url: row.logo_url,
          profile_image_url: row.profile_image_url,
          description: row.description,
        });
      }
    }

    // ── Individual users ───────────────────────────────────────────
    // Uses service client to bypass RLS so all user profiles are visible, not just the caller's own
    if (type === "all" || type === "people") {
      let userQ = serviceSupabase
        .from("user_profiles")
        .select("id, full_name, email, role, business_description")
        .neq("id", user.id) // exclude the logged-in user from their own search results
        .not("role", "in", '("organization_admin","platform_admin")') // org admins appear via their org card
        .order("full_name")
        .range(offset, offset + limit - 1);

      if (role && ["donor", "member", "missionary"].includes(role)) {
        userQ = userQ.eq("role", role);
      }

      if (q.length >= 2) {
        const term = `%${q}%`;
        userQ = userQ.or(`full_name.ilike.${term},email.ilike.${term}`);
      }

      const { data: users } = await userQ;
      for (const u of users ?? []) {
        const row = u as {
          id: string;
          full_name: string | null;
          email: string | null;
          role: string;
          business_description: string | null;
        };
        const displayName = row.full_name?.trim() || row.email?.split("@")[0] || null;
        if (!displayName) continue;
        results.push({
          kind: "user",
          id: row.id,
          name: displayName,
          role: row.role ?? "member",
          bio: row.business_description ?? null,
        });
      }
    }

    return NextResponse.json({ results, total: results.length });
  } catch (e) {
    console.error("Community members error", e);
    return NextResponse.json({ results: [], total: 0 });
  }
}
