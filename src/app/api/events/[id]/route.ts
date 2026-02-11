import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrgAdmin } from "@/lib/auth";

/**
 * GET: Fetch a single event by ID (org admin only, for edit form).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, organizationId } = await requireOrgAdmin();
    if (!organizationId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("events")
      .select("id, slug, name, description, start_at, end_at, venue_name, venue_address, online_event, image_url, ticket_classes, eventbrite_event_id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("events/[id] GET error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch event" },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update an event. Updates local DB only (Eventbrite sync is optional/future).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, organizationId } = await requireOrgAdmin();
    if (!organizationId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let body: {
      name?: string;
      description?: string;
      startAt?: string;
      endAt?: string;
      venueName?: string;
      venueAddress?: string;
      onlineEvent?: boolean;
      imageUrl?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name != null) updates.name = body.name.trim();
    if (body.description != null) updates.description = body.description.trim() || null;
    if (body.startAt != null) updates.start_at = body.startAt;
    if (body.endAt != null) updates.end_at = body.endAt;
    if (body.venueName != null) updates.venue_name = body.venueName.trim() || null;
    if (body.venueAddress != null) updates.venue_address = body.venueAddress.trim() || null;
    if (body.onlineEvent != null) updates.online_event = body.onlineEvent;
    if (body.imageUrl != null) updates.image_url = body.imageUrl.trim() || null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("events")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update event" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("events/[id] PATCH error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update event" },
      { status: 500 }
    );
  }
}
