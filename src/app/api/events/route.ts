import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrgAdmin } from "@/lib/auth";
import {
  createEventbriteEvent,
  createEventbriteTicketClass,
  publishEventbriteEvent,
} from "@/lib/eventbrite/client";

type TicketClassInput = {
  name: string;
  free: boolean;
  quantityTotal: number;
  costCents?: number;
};

/**
 * POST: Create a new event. Syncs to Eventbrite and stores in DB.
 */
export async function POST(req: NextRequest) {
  try {
    let body: {
      organizationId?: string;
      name: string;
      slug: string;
      description?: string;
      startAt: string;
      endAt: string;
      timezone?: string;
      onlineEvent?: boolean;
      venueName?: string;
      venueAddress?: string;
      imageUrl?: string;
      ticketClasses?: TicketClassInput[];
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { supabase, organizationId } = await requireOrgAdmin(body.organizationId);

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization required. Select an organization in your profile." },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      description,
      startAt,
      endAt,
      timezone = "America/New_York",
      onlineEvent = false,
      venueName,
      venueAddress,
      imageUrl,
      ticketClasses = [{ name: "General Admission", free: true, quantityTotal: 100 }],
    } = body;

    if (!name?.trim() || !slug?.trim() || !startAt || !endAt) {
      return NextResponse.json(
        { error: "name, slug, startAt, and endAt are required" },
        { status: 400 }
      );
    }

    const slugSanitized = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slugSanitized) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, eventbrite_org_id, eventbrite_access_token")
      .eq("id", organizationId)
      .single();

    const org = orgRow as {
      id: string;
      name: string;
      eventbrite_org_id: string | null;
      eventbrite_access_token: string | null;
    } | null;

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (!org.eventbrite_org_id || !org.eventbrite_access_token) {
      return NextResponse.json(
        { error: "Connect Eventbrite first. Go to Events and click Connect Eventbrite." },
        { status: 400 }
      );
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid start or end date" },
        { status: 400 }
      );
    }
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const startUtc = startDate.toISOString();
    const endUtc = endDate.toISOString();

    const eventbriteEvent = await createEventbriteEvent(
      org.eventbrite_access_token,
      org.eventbrite_org_id,
      {
        name: name.trim(),
        description: description?.trim(),
        startUtc,
        endUtc,
        timezone,
        onlineEvent,
        venueName: venueName?.trim(),
        venueAddress: venueAddress?.trim(),
        imageUrl: imageUrl?.trim(),
      }
    );

    for (const tc of ticketClasses) {
      if (!tc.name?.trim() || tc.quantityTotal < 1) continue;
      await createEventbriteTicketClass(
        org.eventbrite_access_token,
        eventbriteEvent.id,
        {
          name: tc.name.trim(),
          free: tc.free ?? true,
          quantityTotal: tc.quantityTotal,
          costCents: tc.costCents,
          currency: "USD",
        }
      );
    }

    await publishEventbriteEvent(org.eventbrite_access_token, eventbriteEvent.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (supabase as any)
      .from("events")
      .insert({
        organization_id: organizationId,
        slug: slugSanitized,
        name: name.trim(),
        description: description?.trim() || null,
        start_at: startUtc,
        end_at: endUtc,
        venue_name: venueName?.trim() || null,
        venue_address: venueAddress?.trim() || null,
        online_event: onlineEvent,
        eventbrite_event_id: eventbriteEvent.id,
        eventbrite_org_id: org.eventbrite_org_id,
        image_url: imageUrl?.trim() || null,
        ticket_classes: ticketClasses,
        updated_at: new Date().toISOString(),
      })
      .select("id, slug, name, eventbrite_event_id")
      .single();

    if (error) {
      console.error("Event insert failed:", error);
      return NextResponse.json(
        { error: "Failed to save event" },
        { status: 500 }
      );
    }

    return NextResponse.json(inserted);
  } catch (e) {
    console.error("events POST error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create event" },
      { status: 500 }
    );
  }
}
