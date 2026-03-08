/**
 * GET /api/crm/contacts/[id]/activity — activity timeline for a contact
 * Optional query: ?limit=50&offset=0
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { crmFrom } from "@/lib/crm/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: contactId } = await params;
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 100);
    const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");

    const { data, error, count } = await crmFrom(supabase, "crm_activity_log")
      .select("id, event_type, event_data, created_at", { count: "exact" })
      .eq("contact_id", contactId)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ activity: data ?? [], total: count ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
