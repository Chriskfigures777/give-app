import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, DEFAULT_FROM } from "@/lib/email/resend";

/** Send a personalized survey link (with ?name=...&email=... prefill).
 * Body: { sendTo?: 'all' | 'members' | 'contacts' | 'selected', contactIds?: string[] }
 * - all: everyone with email (default)
 * - members: people with member or get_started in sources_breakdown
 * - contacts: all contacts (same as all for now; distinct from members-only)
 * - selected: only contactIds
 */
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
      .select("id, title, description, status, cover_image_url, theme")
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
    const baseSurveyUrl = appUrl ? `${appUrl}/survey/org/${surveyId}` : "";
    if (!baseSurveyUrl) return NextResponse.json({ error: "App URL not configured" }, { status: 500 });

    let body: { sendTo?: string; contactIds?: string[] } = {};
    try {
      body = await req.json();
    } catch {
      // no body is fine; default to "all"
    }
    const sendTo = (body.sendTo === "members" || body.sendTo === "contacts" || body.sendTo === "selected") ? body.sendTo : "all";
    const contactIds = Array.isArray(body.contactIds) ? body.contactIds.filter((id): id is string => typeof id === "string") : undefined;

    const { data: contacts } = await supabase
      .from("organization_contacts")
      .select("id, email, name, sources_breakdown")
      .eq("organization_id", orgId)
      .not("email", "is", null)
      .is("unsubscribed_at", null);

    let validContacts = (contacts ?? []).filter((c) => c.email?.trim()) as Array<{ id: string; email: string; name: string | null; sources_breakdown?: Record<string, number> | null }>;

    if (sendTo === "members") {
      validContacts = validContacts.filter((c) => {
        const b = c.sources_breakdown ?? {};
        return (b.member ?? 0) > 0 || (b.get_started ?? 0) > 0;
      });
    } else if (sendTo === "selected" && contactIds?.length) {
      const idSet = new Set(contactIds);
      validContacts = validContacts.filter((c) => idSet.has(c.id));
    }

    if (validContacts.length === 0) {
      return NextResponse.json({ error: "No recipients (contacts with email who have not unsubscribed)" }, { status: 400 });
    }

    const s = survey as { title: string; description: string | null; cover_image_url: string | null; theme: Record<string, unknown> | null };
    const title = s.title || "Our survey";
    const accentColor = (s.theme?.accent_color as string | undefined) ?? "#8b5cf6";
    const description = s.description ?? "";

    let sent = 0;

    for (const contact of validContacts) {
      const email = contact.email!.trim();
      const fullName = (contact.name ?? "").trim();
      const firstName = fullName.split(/\s+/)[0] ?? "";

      // Build personalized link with prefill params
      const params = new URLSearchParams();
      if (fullName) params.set("name", fullName);
      params.set("email", email);
      const surveyLink = `${baseSurveyUrl}?${params.toString()}`;

      const greeting = firstName ? `Hi ${firstName},` : "Hi,";
      const subject = `${greeting.replace(",", "")} — ${title}`;

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0e1118;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e1118;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Accent bar -->
          <tr>
            <td style="height:4px;background:${accentColor};border-radius:4px 4px 0 0;"></td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#161b27;border:1px solid rgba(255,255,255,0.08);border-top:none;border-radius:0 0 16px 16px;padding:36px 36px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#eef0f6;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:#8891a5;line-height:1.6;">
                We'd love to hear from you. Please take a moment to share your feedback:
              </p>

              <!-- Survey card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e2435;border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="height:3px;background:${accentColor};"></td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#eef0f6;">${title}</p>
                    ${description ? `<p style="margin:0 0 0;font-size:14px;color:#8891a5;line-height:1.55;">${description}</p>` : ""}
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center" style="border-radius:12px;background:${accentColor};">
                    <a href="${surveyLink}"
                      style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:0.01em;">
                      Open survey →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 24px;font-size:12px;color:#8891a5;">
                Or copy this link:<br/>
                <a href="${surveyLink}" style="color:${accentColor};word-break:break-all;">${surveyLink}</a>
              </p>

              <!-- Footer -->
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 20px;" />
              <p style="margin:0;font-size:11px;color:#4b5468;line-height:1.6;">
                You received this because you're in our contact list.
                <a href="${appUrl}/unsubscribe" style="color:#4b5468;">Unsubscribe</a>
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();

      const result = await sendEmail({
        to: [email],
        subject,
        html,
        from: DEFAULT_FROM,
      });
      if (result.ok) sent++;
    }

    const serviceClient = createServiceClient();
    await serviceClient.from("broadcast_log").insert({
      organization_id: orgId,
      subject: title,
      recipient_count: sent,
    });

    return NextResponse.json({ ok: true, sent, total: validContacts.length });
  } catch (e) {
    console.error("surveys send-link POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send" },
      { status: 500 }
    );
  }
}
