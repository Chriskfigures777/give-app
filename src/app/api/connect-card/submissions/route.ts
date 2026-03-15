import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/connect-card/submissions
 * Returns connect card submissions for the authenticated org admin.
 */
export async function GET() {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("website_form_inquiries")
      .select("id, visitor_name, visitor_email, visitor_phone, fields, created_at")
      .eq("organization_id", orgId)
      .eq("form_kind", "connect_card")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submissions: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
