/**
 * GET  /api/crm/contacts/[id]/surveys — survey assignments + responses for a contact
 * POST /api/crm/contacts/[id]/surveys — assign & send a survey to this contact
 *   Body: { surveyId: string, channel?: 'email'|'sms' }
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

    const { data: assignments, error } = await crmFrom(supabase, "crm_survey_assignments")
      .select(`
        id, assigned_at, sent_at, responded_at, channel,
        organization_surveys(id, title, status)
      `)
      .eq("contact_id", contactId)
      .eq("organization_id", orgId)
      .order("assigned_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignments: assignments ?? [] });
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

    const body = await req.json() as { surveyId?: string; channel?: string };
    if (!body.surveyId) return NextResponse.json({ error: "surveyId is required" }, { status: 400 });

    const channel = (body.channel === "sms" ? "sms" : "email") as "email" | "sms";

    // Verify survey belongs to org and is published
    const { data: survey } = await supabase
      .from("organization_surveys")
      .select("id, title, status")
      .eq("id", body.surveyId)
      .eq("organization_id", orgId)
      .single();

    if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    if ((survey as { status: string }).status !== "published") {
      return NextResponse.json({ error: "Survey must be published to send" }, { status: 400 });
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

    // Create or update assignment
    const now = new Date().toISOString();
    const { data: assignment } = await crmFrom(supabase, "crm_survey_assignments")
      .upsert(
        {
          survey_id: body.surveyId,
          contact_id: contactId,
          organization_id: orgId,
          assigned_by: profile?.id ?? null,
          channel,
          sent_at: now,
        },
        { onConflict: "survey_id,contact_id" }
      )
      .select()
      .single();

    // Build survey link
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const surveyLink = `${appUrl}/survey/org/${body.surveyId}`;
    const surveyTitle = (survey as { title: string }).title;
    const contactName = (contact as { name: string | null }).name ?? "there";

    let sendResult: { ok: boolean; error?: string } = { ok: false, error: "Not sent" };

    if (channel === "email") {
      const email = (contact as { email: string | null }).email;
      if (!email) return NextResponse.json({ error: "Contact has no email" }, { status: 422 });

      const result = await sendEmail({
        to: email,
        subject: `Survey: ${surveyTitle}`,
        html: `
          <p>Hi ${contactName},</p>
          <p>We'd love your feedback. Please take a moment to complete this survey:</p>
          <p><strong>${surveyTitle}</strong></p>
          <p><a href="${surveyLink}" style="color:#0d9488;font-weight:600;font-size:16px;">Take the survey →</a></p>
          <p style="margin-top:24px;font-size:12px;color:#64748b;">
            You received this because your organization sent it to you.
            <a href="${appUrl}/unsubscribe">Unsubscribe</a>
          </p>
        `,
        from: DEFAULT_FROM,
      });
      sendResult = result;
    } else {
      const phone = (contact as { phone: string | null }).phone;
      if (!phone) return NextResponse.json({ error: "Contact has no phone number" }, { status: 422 });

      const result = await sendSms({
        to: phone,
        body: `Hi ${contactName}! We'd love your feedback. Take our survey: ${surveyLink}`,
      });
      sendResult = result.ok ? { ok: true } : { ok: false, error: result.error };
    }

    await logActivity(supabase, {
      contactId,
      organizationId: orgId,
      eventType: "survey_sent",
      eventData: {
        surveyId: body.surveyId,
        surveyTitle,
        channel,
        sent: sendResult.ok,
      },
    });

    return NextResponse.json({
      ok: sendResult.ok,
      assignment,
      sendError: sendResult.ok ? null : sendResult.error,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
