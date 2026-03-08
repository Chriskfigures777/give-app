/**
 * GET  /api/crm/broadcasts              — list broadcast history for the org
 * POST /api/crm/broadcasts              — send a broadcast to a filtered segment
 *   Body: {
 *     channel: 'email'|'sms',
 *     subject?: string,      (email only)
 *     body: string,
 *     filterTagIds?: string[],   (empty = no tag filter)
 *     filterSource?: string,     (donation|form|survey|manual; empty = all)
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { crmFrom } from "@/lib/crm/db";
import { sendEmail, DEFAULT_FROM } from "@/lib/email/resend";
import { sendSmsBatch } from "@/lib/crm/sms";
import { logActivity } from "@/lib/crm/activity";

export async function GET(_req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { data, error } = await crmFrom(supabase, "crm_broadcasts")
      .select("id, channel, subject, body, recipient_count, filter_tags, filter_source, sent_at")
      .eq("organization_id", orgId)
      .order("sent_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ broadcasts: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const body = await req.json() as {
      channel?: string;
      subject?: string;
      body?: string;
      filterTagIds?: string[];
      filterSource?: string;
    };

    if (!body.channel || !["email", "sms"].includes(body.channel)) {
      return NextResponse.json({ error: "channel must be 'email' or 'sms'" }, { status: 400 });
    }
    if (!body.body?.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }

    const channel = body.channel as "email" | "sms";
    const filterTagIds = body.filterTagIds?.filter(Boolean) ?? [];
    const filterSource = body.filterSource?.trim() || null;

    // Fetch contacts matching the filter
    let contactQuery = supabase
      .from("organization_contacts")
      .select("id, email, phone, unsubscribed_at")
      .eq("organization_id", orgId)
      .is("unsubscribed_at", null);

    if (filterSource) {
      contactQuery = contactQuery.eq("source", filterSource);
    }

    let { data: contacts } = await contactQuery;
    contacts = contacts ?? [];

    // Apply tag filter (contacts must have ALL specified tags)
    if (filterTagIds.length > 0) {
      const { data: taggedContactIds } = await crmFrom(supabase, "crm_contact_tags")
        .select("contact_id")
        .in("tag_id", filterTagIds);

      const taggedIds = new Set((taggedContactIds ?? []).map((r: { contact_id: string }) => r.contact_id));
      contacts = contacts.filter((c) => taggedIds.has(c.id));
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: "No eligible recipients match the filter" }, { status: 400 });
    }

    // Extract channel-specific addresses
    const recipients = contacts
      .map((c) => ({
        id: c.id,
        address: channel === "email"
          ? (c as { email: string | null }).email?.trim().toLowerCase()
          : (c as { phone: string | null }).phone?.trim(),
      }))
      .filter((r): r is { id: string; address: string } => Boolean(r.address));

    if (recipients.length === 0) {
      return NextResponse.json({
        error: `No contacts have a ${channel === "email" ? "email address" : "phone number"}`,
      }, { status: 400 });
    }

    // Create broadcast record first (using service client for RLS bypass on insert)
    const serviceClient = createServiceClient();
    const { data: broadcast } = await crmFrom(serviceClient, "crm_broadcasts")
      .insert({
        organization_id: orgId,
        sent_by_user_id: profile?.id ?? null,
        channel,
        subject: body.subject?.trim() || null,
        body: body.body,
        filter_tags: filterTagIds.length > 0 ? filterTagIds : null,
        filter_source: filterSource,
        recipient_count: recipients.length,
      })
      .select("id")
      .single();

    const broadcastId = (broadcast as { id: string } | null)?.id;

    // Send messages
    let sent = 0;

    if (channel === "email") {
      const emails = [...new Set(recipients.map((r) => r.address))];
      const subject = body.subject?.trim() || "(no subject)";
      const html = `<div style="font-family:sans-serif;line-height:1.6">${body.body.replace(/\n/g, "<br>")}</div>`;
      const batchSize = 50;
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        const result = await sendEmail({ to: batch, subject, html, from: DEFAULT_FROM });
        if (result.ok) sent += batch.length;
      }
    } else {
      const phones = [...new Set(recipients.map((r) => r.address))];
      const result = await sendSmsBatch({ to: phones, body: body.body });
      sent = result.sent;
    }

    // Log broadcast recipients and activity
    if (broadcastId) {
      const recipientRows = recipients.map((r) => ({
        broadcast_id: broadcastId,
        contact_id: r.id,
        status: "sent" as const,
      }));
      // Insert in batches of 100
      for (let i = 0; i < recipientRows.length; i += 100) {
        await crmFrom(serviceClient, "crm_broadcast_recipients")
          .insert(recipientRows.slice(i, i + 100));
      }
    }

    // Log activity for each contact (fire-and-forget, in batches)
    for (const r of recipients) {
      void logActivity(supabase, {
        contactId: r.id,
        organizationId: orgId,
        eventType: "broadcast_received",
        eventData: { broadcastId, channel, subject: body.subject },
      });
    }

    return NextResponse.json({
      ok: true,
      broadcastId,
      sent,
      total: recipients.length,
    });
  } catch (e) {
    console.error("crm/broadcasts POST:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
