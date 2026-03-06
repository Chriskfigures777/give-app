import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, DEFAULT_FROM, APP_URL } from "@/lib/email/resend";

const CRON_SECRET = process.env.CRON_SECRET?.trim();

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (CRON_SECRET && req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const in7DaysStart = new Date(now.getTime() + 6.5 * 24 * 60 * 60 * 1000);
  const in7DaysEnd = new Date(now.getTime() + 7.5 * 24 * 60 * 60 * 1000);
  const in24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  let sent = 0;
  let errors = 0;

  for (const { windowStart, windowEnd, reminderType, column } of [
    { windowStart: in7DaysStart, windowEnd: in7DaysEnd, reminderType: "1_week" as const, column: "remind_1_week" },
    { windowStart: in24hStart, windowEnd: in24hEnd, reminderType: "1_day" as const, column: "remind_1_day" },
  ]) {
    const { data: events } = await supabase
      .from("events")
      .select("id, name, start_at, end_at, organization_id, organizations(slug)")
      .gte("start_at", windowStart.toISOString())
      .lte("start_at", windowEnd.toISOString())
      .eq(column, true);

    if (!events?.length) continue;

    for (const event of events as Array<{
      id: string;
      name: string;
      start_at: string;
      end_at: string;
      organization_id: string;
      organizations: { slug: string } | null;
    }>) {
      const orgId = event.organization_id;
      const orgSlug = event.organizations?.slug ?? "";
      const siteUrl = orgSlug ? `${APP_URL.replace(/\/$/, "")}/site/${orgSlug}` : APP_URL;

      const { data: contacts } = await supabase
        .from("organization_contacts")
        .select("id, email")
        .eq("organization_id", orgId)
        .not("email", "is", null);

      if (!contacts?.length) continue;

      const { data: alreadySent } = await supabase
        .from("event_reminder_sends")
        .select("contact_id")
        .eq("event_id", event.id)
        .eq("reminder_type", reminderType);
      const sentSet = new Set((alreadySent ?? []).map((r: { contact_id: string }) => r.contact_id));

      const startDate = new Date(event.start_at);
      const dateStr = startDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const timeStr = startDate.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
      const subject =
        reminderType === "1_week"
          ? `Reminder: ${event.name} in one week`
          : `Reminder: ${event.name} tomorrow`;
      const html = `
        <p>Hi,</p>
        <p>This is a reminder about <strong>${escapeHtml(event.name)}</strong>.</p>
        <p><strong>When:</strong> ${dateStr} at ${timeStr}</p>
        <p><a href="${escapeHtml(siteUrl)}" style="color:#0d9488;">View details</a></p>
      `;

      for (const contact of contacts as Array<{ id: string; email: string | null }>) {
        if (!contact.email?.trim() || sentSet.has(contact.id)) continue;
        const result = await sendEmail({
          to: contact.email,
          subject,
          html,
          from: DEFAULT_FROM,
        });
        if (result.ok) {
          await supabase.from("event_reminder_sends").insert({
            event_id: event.id,
            contact_id: contact.id,
            reminder_type: reminderType,
          });
          sent++;
        } else {
          errors++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent, errors });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
