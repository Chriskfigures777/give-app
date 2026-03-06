import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, DEFAULT_FROM } from "@/lib/email/resend";

/** Send survey link to all contacts with email (who have not unsubscribed). Uses Resend; messages sent via the platform. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params;
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { data: survey, error: surveyErr } = await supabase
      .from("organization_surveys")
      .select("id, title, status")
      .eq("id", surveyId)
      .eq("organization_id", orgId)
      .single();

    if (surveyErr || !survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }
    if ((survey as { status: string }).status !== "published") {
      return NextResponse.json({ error: "Survey must be published to send" }, { status: 400 });
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const surveyLink = appUrl ? `${appUrl}/survey/org/${surveyId}` : "";
    if (!surveyLink) return NextResponse.json({ error: "App URL not configured" }, { status: 500 });

    const { data: contacts } = await supabase
      .from("organization_contacts")
      .select("id, email")
      .eq("organization_id", orgId)
      .not("email", "is", null)
      .is("unsubscribed_at", null);

    const emails = [...new Set(
      (contacts ?? [])
        .filter((c) => c.email?.trim())
        .map((c) => c.email!.trim().toLowerCase())
    )];

    if (emails.length === 0) {
      return NextResponse.json({ error: "No recipients (contacts with email who have not unsubscribed)" }, { status: 400 });
    }

    const title = (survey as { title: string }).title || "Our survey";
    const subject = `Take our survey: ${title}`;
    const html = `
      <p>Hi,</p>
      <p>We'd love your feedback. Please take a moment to complete this short survey:</p>
      <p><a href="${surveyLink}" style="color:#0d9488;font-weight:600;">Open survey</a></p>
      <p>Or copy this link: ${surveyLink}</p>
      <p style="margin-top:24px;font-size:12px;color:#64748b;">You received this because you're in our organization's contact list. <a href="${appUrl}/unsubscribe">Unsubscribe</a> from these emails.</p>
    `;

    let sent = 0;
    const batchSize = 50;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const result = await sendEmail({
        to: batch,
        subject,
        html,
        from: DEFAULT_FROM,
      });
      if (result.ok) sent += batch.length;
    }

    const serviceClient = createServiceClient();
    await serviceClient.from("broadcast_log").insert({
      organization_id: orgId,
      subject,
      recipient_count: sent,
    });

    return NextResponse.json({ ok: true, sent, total: emails.length });
  } catch (e) {
    console.error("surveys send-link POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send" },
      { status: 500 }
    );
  }
}
