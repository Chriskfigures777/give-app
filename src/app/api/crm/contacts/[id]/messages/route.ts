/**
 * GET  /api/crm/contacts/[id]/messages — message history for a contact
 * POST /api/crm/contacts/[id]/messages — send a new email or SMS
 *   Body: { channel: 'email'|'sms', subject?: string, body: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendEmail, DEFAULT_FROM } from "@/lib/email/resend";
import { sendSms } from "@/lib/crm/sms";
import { logActivity } from "@/lib/crm/activity";
import { crmFrom } from "@/lib/crm/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id: contactId } = await params;
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { data, error } = await crmFrom(supabase, "crm_messages")
      .select("id, channel, subject, body, status, sent_at, sent_by_user_id")
      .eq("contact_id", contactId)
      .eq("organization_id", orgId)
      .order("sent_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ messages: data ?? [] });
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

    const body = await req.json() as {
      channel?: string;
      subject?: string;
      body?: string;
    };

    if (!body.channel || !["email", "sms"].includes(body.channel)) {
      return NextResponse.json({ error: "channel must be 'email' or 'sms'" }, { status: 400 });
    }
    if (!body.body?.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }

    // Fetch contact
    const { data: contact } = await supabase
      .from("organization_contacts")
      .select("id, email, phone, name, unsubscribed_at")
      .eq("id", contactId)
      .eq("organization_id", orgId)
      .single();

    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    if ((contact as { unsubscribed_at: string | null }).unsubscribed_at) {
      return NextResponse.json({ error: "Contact has unsubscribed" }, { status: 422 });
    }

    const channel = body.channel as "email" | "sms";
    let status: "sent" | "failed" = "sent";
    let externalId: string | null = null;
    let sendError: string | null = null;

    if (channel === "email") {
      const email = (contact as { email: string | null }).email;
      if (!email) return NextResponse.json({ error: "Contact has no email address" }, { status: 422 });

      const result = await sendEmail({
        to: email,
        subject: body.subject?.trim() || "(no subject)",
        html: `<div style="font-family:sans-serif;line-height:1.6">${body.body.replace(/\n/g, "<br>")}</div>`,
        from: DEFAULT_FROM,
      });

      if (result.ok) {
        externalId = result.id;
      } else {
        status = "failed";
        sendError = result.error;
      }
    } else {
      // SMS
      const phone = (contact as { phone: string | null }).phone;
      if (!phone) return NextResponse.json({ error: "Contact has no phone number" }, { status: 422 });

      const result = await sendSms({ to: phone, body: body.body });
      if (result.ok) {
        externalId = result.sid;
      } else {
        status = "failed";
        sendError = result.error;
      }
    }

    // Record the message regardless of success (for history)
    const { data: msgRecord } = await crmFrom(supabase, "crm_messages")
      .insert({
        contact_id: contactId,
        organization_id: orgId,
        sent_by_user_id: profile?.id ?? null,
        channel,
        subject: body.subject?.trim() || null,
        body: body.body,
        status,
        external_id: externalId,
      })
      .select("id, channel, subject, body, status, sent_at")
      .single();

    await logActivity(supabase, {
      contactId,
      organizationId: orgId,
      eventType: "message_sent",
      eventData: {
        channel,
        subject: body.subject,
        status,
        messageId: (msgRecord as { id: string } | null)?.id,
      },
    });

    if (status === "failed") {
      return NextResponse.json({ ok: false, error: sendError, message: msgRecord }, { status: 207 });
    }

    return NextResponse.json({ ok: true, message: msgRecord }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
