import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, DEFAULT_FROM } from "@/lib/email/resend";

const UNSUBSCRIBE_PLACEHOLDER = "{{unsubscribe_url}}";
const IS_DEV = process.env.NODE_ENV === "development";
const HAS_RESEND = !!(
  process.env.RESEND_API_KEY?.trim() || process.env.Resend_API_Key?.trim()
);

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    let body: { subject?: string; body?: string; html?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    if (!subject) {
      return NextResponse.json({ error: "Subject required" }, { status: 400 });
    }

    const htmlRaw =
      typeof body.html === "string"
        ? body.html
        : typeof body.body === "string"
          ? body.body.replace(/\n/g, "<br>")
          : "";
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const unsubUrl = appUrl ? `${appUrl}/unsubscribe?org=${orgId}` : "#";
    const html = htmlRaw.includes(UNSUBSCRIBE_PLACEHOLDER)
      ? htmlRaw.replace(UNSUBSCRIBE_PLACEHOLDER, unsubUrl)
      : `${htmlRaw}<p style="margin-top:24px;font-size:12px;color:#64748b;"><a href="${unsubUrl}">Unsubscribe</a> from these emails.</p>`;

    const { data: contacts } = await supabase
      .from("organization_contacts")
      .select("id, email")
      .eq("organization_id", orgId)
      .not("email", "is", null)
      .is("unsubscribed_at", null);

    const recipients = (contacts ?? []).filter(
      (c: { email: string | null }) => c.email && c.email.trim()
    ) as Array<{ id: string; email: string }>;
    const emails = [...new Set(recipients.map((r) => r.email.trim().toLowerCase()))];

    if (emails.length === 0) {
      return NextResponse.json(
        { error: "No recipients — add contacts with email addresses, or they may have unsubscribed." },
        { status: 400 }
      );
    }

    // ── Dev mode: Resend not configured — log to console and simulate success ──
    if (IS_DEV && !HAS_RESEND) {
      console.log("\n╔══════════════════════════════════════════════════════╗");
      console.log("║  📧  BROADCAST EMAIL (dev preview — not actually sent)  ║");
      console.log("╠══════════════════════════════════════════════════════╣");
      console.log(`║  To:      ${emails.length} recipient(s)`);
      console.log(`║  From:    ${DEFAULT_FROM}`);
      console.log(`║  Subject: ${subject}`);
      console.log("╠══════════════════════════════════════════════════════╣");
      console.log(body.body ?? "(no plain text body)");
      console.log("╚══════════════════════════════════════════════════════╝\n");

      const serviceClient = createServiceClient();
      const { data: devLog } = await serviceClient
        .from("broadcast_log")
        .insert({ organization_id: orgId, subject, recipient_count: emails.length })
        .select("id")
        .single();

      const devId = (devLog as { id: string } | null)?.id ?? null;
      return NextResponse.json({
        ok: true,
        sent: emails.length,
        total: emails.length,
        id: devId,
        dev: true,
      });
    }

    // ── Production: Resend not configured ──
    if (!HAS_RESEND) {
      return NextResponse.json(
        { error: "Email service not configured. Add RESEND_API_KEY to your environment variables." },
        { status: 503 }
      );
    }

    // ── Send via Resend ──
    let sent = 0;
    let lastError = "";
    const batchSize = 50;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const result = await sendEmail({
        to: batch,
        subject,
        html,
        from: DEFAULT_FROM,
      });
      if (result.ok) {
        sent += batch.length;
      } else {
        lastError = result.error;
        console.error(`[broadcast] batch ${i / batchSize + 1} failed:`, result.error);
      }
    }

    // If nothing was delivered at all, surface the error instead of silently logging 0
    if (sent === 0) {
      return NextResponse.json(
        {
          error: lastError
            ? `Failed to send: ${lastError}`
            : "Email delivery failed. Check your RESEND_API_KEY and RESEND_FROM_EMAIL configuration.",
        },
        { status: 500 }
      );
    }

    const serviceClient = createServiceClient();
    const { data: logRow } = await serviceClient
      .from("broadcast_log")
      .insert({ organization_id: orgId, subject, recipient_count: sent })
      .select("id")
      .single();

    const broadcastId = (logRow as { id: string } | null)?.id ?? null;
    return NextResponse.json({ ok: true, sent, total: emails.length, id: broadcastId });
  } catch (e) {
    console.error("broadcast POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send" },
      { status: 500 }
    );
  }
}
