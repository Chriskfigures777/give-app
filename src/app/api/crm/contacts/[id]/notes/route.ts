/**
 * GET    /api/crm/contacts/[id]/notes        — list notes for a contact
 * POST   /api/crm/contacts/[id]/notes        — add a note  { content }
 * PATCH  /api/crm/contacts/[id]/notes?noteId — edit a note { content }
 * DELETE /api/crm/contacts/[id]/notes?noteId — delete a note
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

    const { data, error } = await crmFrom(supabase, "crm_contact_notes")
      .select("id, content, created_at, updated_at, author_user_id")
      .eq("contact_id", contactId)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ notes: data ?? [] });
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

    const body = await req.json() as { content?: string };
    const content = body.content?.trim();
    if (!content) return NextResponse.json({ error: "Note content is required" }, { status: 400 });

    const { data, error } = await crmFrom(supabase, "crm_contact_notes")
      .insert({
        contact_id: contactId,
        organization_id: orgId,
        author_user_id: profile?.id ?? null,
        content,
      })
      .select("id, content, created_at, updated_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logActivity(supabase, {
      contactId,
      organizationId: orgId,
      eventType: "note_added",
      eventData: { noteId: (data as unknown as { id: string }).id, preview: content.slice(0, 80) },
    });

    return NextResponse.json({ note: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: contactId } = await params;
    const noteId = req.nextUrl.searchParams.get("noteId");
    if (!noteId) return NextResponse.json({ error: "noteId query param required" }, { status: 400 });

    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const body = await req.json() as { content?: string };
    const content = body.content?.trim();
    if (!content) return NextResponse.json({ error: "Note content is required" }, { status: 400 });

    const { data, error } = await crmFrom(supabase, "crm_contact_notes")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .eq("contact_id", contactId)
      .eq("organization_id", orgId)
      .select("id, content, created_at, updated_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    await logActivity(supabase, {
      contactId,
      organizationId: orgId,
      eventType: "note_edited",
      eventData: { noteId },
    });

    return NextResponse.json({ note: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: contactId } = await params;
    const noteId = req.nextUrl.searchParams.get("noteId");
    if (!noteId) return NextResponse.json({ error: "noteId query param required" }, { status: 400 });

    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { error } = await crmFrom(supabase, "crm_contact_notes")
      .delete()
      .eq("id", noteId)
      .eq("contact_id", contactId)
      .eq("organization_id", orgId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logActivity(supabase, {
      contactId,
      organizationId: orgId,
      eventType: "note_deleted",
      eventData: { noteId },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
