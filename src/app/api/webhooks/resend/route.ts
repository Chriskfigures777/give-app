/**
 * Resend webhook endpoint.
 *
 * Handles `email.received` events for inbound email replies.
 * When a reply arrives at `reply+{threadToken}@{domain}`, we:
 *   1. Look up the inquiry by threadToken
 *   2. Fetch the full email content via Resend API
 *   3. Store the message
 *   4. Forward the reply to the other party (org → visitor or visitor → org)
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, DEFAULT_FROM } from "@/lib/email/resend";

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET?.trim() || "";

function getResendClient(): Resend | null {
  const key =
    process.env.RESEND_API_KEY?.trim() ||
    process.env.Resend_API_Key?.trim() ||
    "";
  return key ? new Resend(key) : null;
}

function extractThreadToken(toAddresses: string[]): string | null {
  for (const addr of toAddresses) {
    const match = addr.match(/reply\+([A-Za-z0-9_-]+)@/);
    if (match) return match[1];
  }
  return null;
}

function withDisplayName(from: string, name: string): string {
  const m = from.match(/<([^>]+)>/);
  const email = m?.[1] ?? from.trim();
  const safeName = name.replace(/[\r\n"]/g, "").trim();
  return safeName ? `${safeName} <${email}>` : from;
}

function buildReplyToAddress(threadToken: string): string | null {
  const domain =
    process.env.RESEND_INBOUND_DOMAIN?.trim() ||
    process.env.RESEND_RECEIVE_DOMAIN?.trim() ||
    "";
  if (!domain) return null;
  return `reply+${threadToken}@${domain}`;
}

function extractSenderEmail(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return m?.[1]?.trim().toLowerCase() ?? from.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Optionally verify webhook signature
    if (WEBHOOK_SECRET) {
      const resend = getResendClient();
      if (resend) {
        try {
          resend.webhooks.verify({
            payload: rawBody,
            headers: {
              id: req.headers.get("svix-id") ?? "",
              timestamp: req.headers.get("svix-timestamp") ?? "",
              signature: req.headers.get("svix-signature") ?? "",
            },
            webhookSecret: WEBHOOK_SECRET,
          });
        } catch {
          console.error("[resend-webhook] Signature verification failed");
          return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }
      }
    }

    if (event.type !== "email.received") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const data = event.data as Record<string, unknown> | undefined;
    if (!data) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const emailId = data.email_id as string | undefined;
    const toAddresses = Array.isArray(data.to)
      ? (data.to as string[])
      : typeof data.to === "string"
        ? [data.to]
        : [];
    const fromRaw = (data.from as string) ?? "";
    const subject = (data.subject as string) ?? "(no subject)";

    const threadToken = extractThreadToken(toAddresses);
    if (!threadToken) {
      console.warn("[resend-webhook] No thread token found in to:", toAddresses);
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = createServiceClient();

    const { data: inquiry } = await supabase
      .from("website_form_inquiries")
      .select("id, organization_id, org_slug, visitor_email, visitor_name, thread_token")
      .eq("thread_token", threadToken)
      .maybeSingle();

    if (!inquiry) {
      console.warn("[resend-webhook] No inquiry for thread:", threadToken);
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Fetch full email content from Resend
    let emailHtml: string | null = null;
    let emailText: string | null = null;
    if (emailId) {
      const resend = getResendClient();
      if (resend) {
        try {
          const { data: received } = await resend.emails.receiving.get(emailId);
          emailHtml = (received as unknown as Record<string, unknown>)?.html as string ?? null;
          emailText = (received as unknown as Record<string, unknown>)?.text as string ?? null;
        } catch (e) {
          console.warn("[resend-webhook] Failed to fetch email content:", e);
        }
      }
    }

    const senderEmail = extractSenderEmail(fromRaw);
    const inq = inquiry as {
      id: string;
      organization_id: string;
      org_slug: string;
      visitor_email: string;
      visitor_name: string | null;
      thread_token: string;
    };

    // Determine direction: is the sender the visitor, or the org?
    const isVisitor = senderEmail === inq.visitor_email.toLowerCase();

    // Fetch org for forwarding config
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, owner_user_id, website_forms_forward_to_email, website_forms_reply_name")
      .eq("id", inq.organization_id)
      .maybeSingle();

    let orgForwardEmail: string | null =
      (org as { website_forms_forward_to_email?: string | null } | null)
        ?.website_forms_forward_to_email ?? null;
    if (!orgForwardEmail && org) {
      const ownerId = (org as { owner_user_id?: string | null }).owner_user_id ?? null;
      if (ownerId) {
        const { data: ownerProfile } = await supabase
          .from("user_profiles")
          .select("email, business_email")
          .eq("id", ownerId)
          .maybeSingle();
        const p = ownerProfile as { email?: string | null; business_email?: string | null } | null;
        orgForwardEmail = (p?.business_email ?? p?.email ?? null) || null;
      }
    }

    const orgName =
      (org as { name?: string } | null)?.name ?? "Organization";
    const replyName =
      (org as { website_forms_reply_name?: string | null } | null)?.website_forms_reply_name ?? orgName;
    const replyToAddr = buildReplyToAddress(inq.thread_token);

    if (isVisitor) {
      // Visitor replied → forward to org
      if (!orgForwardEmail) {
        console.warn("[resend-webhook] No org forward email for inquiry:", inq.id);
        return NextResponse.json({ ok: true, skipped: true });
      }

      await supabase.from("website_form_messages").insert({
        inquiry_id: inq.id,
        direction: "visitor_to_org",
        from_email: senderEmail,
        to_email: orgForwardEmail,
        subject,
        text: emailText,
        html: emailHtml,
        resend_received_email_id: emailId ?? null,
      });

      const sendRes = await sendEmail({
        to: orgForwardEmail,
        subject,
        html:
          emailHtml ??
          `<pre style="font-family:sans-serif;white-space:pre-wrap;">${(emailText ?? "(no content)").replace(/</g, "&lt;")}</pre>`,
        from: withDisplayName(DEFAULT_FROM, inq.visitor_name ?? "Visitor"),
        replyTo: replyToAddr ?? undefined,
      });

      if (sendRes.ok) {
        // best-effort: store outbound id
        await supabase
          .from("website_form_messages")
          .update({ resend_email_id: sendRes.id })
          .eq("resend_received_email_id", emailId ?? "");
      }
    } else {
      // Org replied → forward to visitor
      await supabase.from("website_form_messages").insert({
        inquiry_id: inq.id,
        direction: "org_to_visitor",
        from_email: senderEmail,
        to_email: inq.visitor_email,
        subject,
        text: emailText,
        html: emailHtml,
        resend_received_email_id: emailId ?? null,
      });

      const sendRes = await sendEmail({
        to: inq.visitor_email,
        subject,
        html:
          emailHtml ??
          `<pre style="font-family:sans-serif;white-space:pre-wrap;">${(emailText ?? "(no content)").replace(/</g, "&lt;")}</pre>`,
        from: withDisplayName(DEFAULT_FROM, replyName),
        replyTo: replyToAddr ?? undefined,
      });

      if (sendRes.ok) {
        await supabase
          .from("website_form_messages")
          .update({ resend_email_id: sendRes.id })
          .eq("resend_received_email_id", emailId ?? "");
      }
    }

    // Update inquiry timestamp
    await supabase
      .from("website_form_inquiries")
      .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", inq.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[resend-webhook] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
