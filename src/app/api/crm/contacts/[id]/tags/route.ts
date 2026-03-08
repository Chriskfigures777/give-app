/**
 * GET    /api/crm/contacts/[id]/tags           — list tags on this contact
 * POST   /api/crm/contacts/[id]/tags           — assign a tag  { tagId }
 * DELETE /api/crm/contacts/[id]/tags?tagId=... — remove a tag
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/crm/activity";
import { crmFrom } from "@/lib/crm/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id: contactId } = await params;
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { data, error } = await crmFrom(supabase, "crm_contact_tags")
      .select("id, assigned_at, crm_tags(id, name, color)")
      .eq("contact_id", contactId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const tags = (data ?? []).map((row: {
      id: string;
      assigned_at: string;
      crm_tags: { id: string; name: string; color: string } | null;
    }) => ({
      assignmentId: row.id,
      assignedAt: row.assigned_at,
      ...(row.crm_tags ?? { id: "", name: "", color: "" }),
    }));

    return NextResponse.json({ tags });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: contactId } = await params;
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const body = await req.json() as { tagId?: string };
    if (!body.tagId) return NextResponse.json({ error: "tagId is required" }, { status: 400 });

    // Verify tag belongs to org
    const { data: tag } = await crmFrom(supabase, "crm_tags")
      .select("id, name, color")
      .eq("id", body.tagId)
      .eq("organization_id", orgId)
      .single();
    if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

    const { data, error } = await crmFrom(supabase, "crm_contact_tags")
      .insert({ contact_id: contactId, tag_id: body.tagId })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Tag already assigned" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabase, {
      contactId,
      organizationId: orgId,
      eventType: "tag_added",
      eventData: { tagId: body.tagId, tagName: (tag as { name: string }).name },
    });

    return NextResponse.json({ assignment: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: contactId } = await params;
    const tagId = req.nextUrl.searchParams.get("tagId");
    if (!tagId) return NextResponse.json({ error: "tagId query param required" }, { status: 400 });

    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { data: tag } = await crmFrom(supabase, "crm_tags")
      .select("name")
      .eq("id", tagId)
      .eq("organization_id", orgId)
      .single();

    const { error } = await crmFrom(supabase, "crm_contact_tags")
      .delete()
      .eq("contact_id", contactId)
      .eq("tag_id", tagId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logActivity(supabase, {
      contactId,
      organizationId: orgId,
      eventType: "tag_removed",
      eventData: { tagId, tagName: (tag as { name: string } | null)?.name ?? "" },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
