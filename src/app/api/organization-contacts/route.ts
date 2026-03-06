import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * POST: Manually add a contact to the organization's people list.
 */
export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const body = await req.json() as { name?: string; email?: string; phone?: string };
    const name = body.name?.trim() || null;
    const email = body.email?.trim()?.toLowerCase() || null;
    const phone = body.phone?.trim() || null;

    if (!name && !email) {
      return NextResponse.json({ error: "Name or email is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const payload = {
      organization_id: orgId,
      email,
      name,
      phone,
      source: "manual",
      sources_breakdown: { manual: 1 },
      first_seen_at: now,
      last_seen_at: now,
      created_at: now,
      updated_at: now,
    };

    let data, error;
    if (email) {
      ({ data, error } = await supabase
        .from("organization_contacts")
        .upsert(payload, { onConflict: "organization_id,email" })
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from("organization_contacts")
        .insert(payload)
        .select()
        .single());
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contact: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

/**
 * GET: List organization contacts (CRM) for the authenticated user's org.
 */
export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    const isPlatformAdmin = profile?.role === "platform_admin";

    if (!isPlatformAdmin && !orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const queryOrgId = req.nextUrl.searchParams.get("organizationId") ?? orgId ?? undefined;
    if (!queryOrgId) {
      return NextResponse.json({ contacts: [] });
    }

    const { data, error } = await supabase
      .from("organization_contacts")
      .select("id, email, name, phone, source, sources_breakdown, first_seen_at, last_seen_at, created_at")
      .eq("organization_id", queryOrgId)
      .order("last_seen_at", { ascending: false });

    if (error) {
      console.error("organization-contacts GET:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contacts: data ?? [] });
  } catch (e) {
    console.error("organization-contacts GET error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
