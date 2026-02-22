/**
 * Public website forms endpoint.
 *
 * Used by static/published websites (often cross-origin) to submit inquiries.
 * Stores inquiry + first message, then emails the org using Resend with a reply-to
 * address that routes back through our inbound webhook.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, DEFAULT_FROM } from "@/lib/email/resend";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function normalizeEmail(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const v = s.trim();
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v.toLowerCase();
}

function normalizeName(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const v = s.trim();
  if (!v) return null;
  return v.length > 120 ? v.slice(0, 120) : v;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toTextFields(fields: Record<string, unknown>): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(fields)) {
    if (!k) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === "string") out.push([k, v]);
    else if (typeof v === "number" || typeof v === "boolean") out.push([k, String(v)]);
    else out.push([k, JSON.stringify(v)]);
  }
  return out;
}

function parsePageSlug(pagePath: string | null, orgSlug: string): string | null {
  if (!pagePath) return null;
  try {
    const url = pagePath.startsWith("http") ? new URL(pagePath) : null;
    const path = (url ? url.pathname : pagePath).split("?")[0].split("#")[0];
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) return "";
    // /site/{orgSlug}/{page}
    const siteIdx = parts.indexOf("site");
    if (siteIdx >= 0 && parts[siteIdx + 1] === orgSlug) {
      return parts[siteIdx + 2] ?? "";
    }
    // /{page}
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}

function buildReplyToAddress(threadToken: string): string | null {
  const domain =
    process.env.RESEND_INBOUND_DOMAIN?.trim() ||
    process.env.RESEND_RECEIVE_DOMAIN?.trim() ||
    "";
  if (!domain) return null;
  return `reply+${threadToken}@${domain}`;
}

function withDisplayName(from: string, name: string): string {
  const m = from.match(/<([^>]+)>/);
  const email = m?.[1] ?? from.trim();
  const safeName = name.replace(/[\r\n"]/g, "").trim();
  return safeName ? `${safeName} <${email}>` : from;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orgSlug = typeof body?.orgSlug === "string" ? body.orgSlug.trim() : "";
    if (!orgSlug) {
      return NextResponse.json({ error: "orgSlug required" }, { status: 400, headers: CORS });
    }

    const visitorEmail = normalizeEmail(body?.visitorEmail ?? body?.email);
    if (!visitorEmail) {
      return NextResponse.json({ error: "visitorEmail required" }, { status: 400, headers: CORS });
    }

    const visitorName = normalizeName(body?.visitorName ?? body?.name);
    const visitorPhone = typeof body?.visitorPhone === "string" ? body.visitorPhone.trim() : null;
    const formKind = typeof body?.formKind === "string" ? body.formKind.trim() : null;
    const pagePath = typeof body?.pagePath === "string" ? body.pagePath.trim() : null;
    const pageSlug = parsePageSlug(pagePath, orgSlug);

    const fieldsObj =
      body?.fields && typeof body.fields === "object" && !Array.isArray(body.fields)
        ? (body.fields as Record<string, unknown>)
        : {};

    const subjectBase =
      typeof body?.subject === "string" && body.subject.trim()
        ? body.subject.trim()
        : `New website inquiry${formKind ? ` (${formKind})` : ""}${pageSlug ? ` – ${pageSlug}` : ""}`;

    const supabase = createServiceClient();

    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, slug, owner_user_id, website_forms_forward_to_email, website_forms_reply_name")
      .eq("slug", orgSlug)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404, headers: CORS });
    }

    // Determine where to forward submissions
    let forwardToEmail =
      (org as { website_forms_forward_to_email?: string | null }).website_forms_forward_to_email ?? null;
    if (!forwardToEmail) {
      const ownerId = (org as { owner_user_id?: string | null }).owner_user_id ?? null;
      if (ownerId) {
        const { data: ownerProfile } = await supabase
          .from("user_profiles")
          .select("email, business_email")
          .eq("id", ownerId)
          .maybeSingle();
        const p = ownerProfile as { email?: string | null; business_email?: string | null } | null;
        forwardToEmail = (p?.business_email ?? p?.email ?? null) || null;
      }
    }

    if (!forwardToEmail) {
      return NextResponse.json(
        { error: "This organization has not configured a forwarding email for website forms." },
        { status: 400, headers: CORS }
      );
    }

    // Create an unguessable thread token for email reply routing
    const threadToken = crypto.randomBytes(16).toString("base64url");
    const replyTo = buildReplyToAddress(threadToken);

    const orgId = (org as { id: string }).id;
    const orgName = (org as { name?: string }).name ?? "Organization";
    const replyName =
      (org as { website_forms_reply_name?: string | null }).website_forms_reply_name ??
      orgName;

    const fieldsList = toTextFields(fieldsObj);
    const plainText = [
      `New website inquiry for ${orgName}`,
      "",
      `From: ${visitorName ? `${visitorName} <${visitorEmail}>` : visitorEmail}`,
      visitorPhone ? `Phone: ${visitorPhone}` : null,
      pageSlug != null ? `Page: ${pageSlug || "home"}` : null,
      formKind ? `Form: ${formKind}` : null,
      "",
      "Fields:",
      ...fieldsList.map(([k, v]) => `- ${k}: ${v}`),
      "",
      "Reply by replying to this email.",
    ]
      .filter(Boolean)
      .join("\n");

    const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>${escapeHtml(subjectBase)}</title></head>
  <body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
    <h1 style="font-size:18px;margin:0 0 12px;">New website inquiry</h1>
    <p style="margin:0 0 12px;"><strong>Organization:</strong> ${escapeHtml(orgName)}</p>
    <p style="margin:0 0 12px;"><strong>From:</strong> ${escapeHtml(visitorName ? `${visitorName} <${visitorEmail}>` : visitorEmail)}</p>
    ${visitorPhone ? `<p style="margin:0 0 12px;"><strong>Phone:</strong> ${escapeHtml(visitorPhone)}</p>` : ""}
    ${pageSlug != null ? `<p style="margin:0 0 12px;"><strong>Page:</strong> ${escapeHtml(pageSlug || "home")}</p>` : ""}
    ${formKind ? `<p style="margin:0 0 12px;"><strong>Form:</strong> ${escapeHtml(formKind)}</p>` : ""}
    <div style="margin-top:16px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
      <div style="font-size:12px;font-weight:700;color:#334155;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">Fields</div>
      <ul style="padding-left:18px;margin:0;">
        ${fieldsList.map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</li>`).join("")}
      </ul>
    </div>
    <p style="margin-top:18px;color:#334155;font-size:13px;">
      Reply by replying to this email. Replies are routed through Give so the visitor can reply back without a portal.
    </p>
  </body>
</html>`;

    const { data: inquiry, error: inquiryErr } = await supabase
      .from("website_form_inquiries")
      .insert({
        organization_id: orgId,
        org_slug: orgSlug,
        page_slug: pageSlug,
        form_kind: formKind,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        visitor_phone: visitorPhone,
        subject: subjectBase,
        fields: fieldsObj as Record<string, string>,
        thread_token: threadToken,
      })
      .select("id")
      .single();

    if (inquiryErr || !inquiry) {
      return NextResponse.json({ error: inquiryErr?.message ?? "Failed to store inquiry" }, { status: 500, headers: CORS });
    }

    const messageInsert = await supabase
      .from("website_form_messages")
      .insert({
        inquiry_id: (inquiry as { id: string }).id,
        direction: "visitor_to_org",
        from_email: visitorEmail,
        to_email: forwardToEmail,
        subject: subjectBase,
        text: plainText,
        html,
      })
      .select("id")
      .single();

    if (messageInsert.error) {
      // Keep the inquiry, but report error
      return NextResponse.json({ error: messageInsert.error.message }, { status: 500, headers: CORS });
    }

    const sendRes = await sendEmail({
      to: forwardToEmail,
      subject: subjectBase,
      html,
      from: withDisplayName(DEFAULT_FROM, replyName),
      replyTo: replyTo ?? undefined,
    });

    // Store outbound email id (best-effort)
    if (sendRes.ok) {
      await supabase
        .from("website_form_messages")
        .update({ resend_email_id: sendRes.id })
        .eq("id", (messageInsert.data as { id: string }).id);
    }

    // --- Auto-reply confirmation email to the visitor ---
    const autoReplyEnabled = true;

    if (autoReplyEnabled && visitorEmail) {
      let customMessage: string | null = null;

      const displayName = visitorName ?? "there";

      const bodyText = customMessage
        ? customMessage.replace(/\{\{name\}\}/gi, displayName)
        : `Thank you for reaching out! We received your message and someone from our team will get back to you shortly.`;

      const bodyHtmlParagraphs = bodyText
        .split(/\n{2,}/)
        .map((p) => `<p style="margin:0 0 14px;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
        .join("");

      const autoReplySubject = `Re: ${subjectBase}`;
      const autoReplyHtml = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>${escapeHtml(autoReplySubject)}</title></head>
  <body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
    <p style="margin:0 0 14px;">Hi ${escapeHtml(displayName)},</p>
    ${bodyHtmlParagraphs}
    ${forwardToEmail ? `<p style="margin:0 0 14px;color:#475569;font-size:13px;">You can also reach us directly at <a href="mailto:${escapeHtml(forwardToEmail)}" style="color:#0284c7;">${escapeHtml(forwardToEmail)}</a>.</p>` : ""}
    <p style="margin:24px 0 0;color:#475569;font-size:13px;">&mdash; ${escapeHtml(orgName)}</p>
  </body>
</html>`;

      const autoReplyPlain = [
        `Hi ${displayName},`,
        "",
        bodyText,
        "",
        forwardToEmail ? `You can also reach us directly at ${forwardToEmail}.` : null,
        "",
        `— ${orgName}`,
      ]
        .filter((line) => line !== null)
        .join("\n");

      const autoReplyRes = await sendEmail({
        to: visitorEmail,
        subject: autoReplySubject,
        html: autoReplyHtml,
        from: withDisplayName(DEFAULT_FROM, replyName),
        replyTo: forwardToEmail ?? undefined,
      });

      // Store auto-reply message (best-effort, regardless of send success)
      await supabase.from("website_form_messages").insert({
        inquiry_id: (inquiry as { id: string }).id,
        direction: "org_to_visitor",
        from_email: DEFAULT_FROM.replace(/.*<([^>]+)>.*/, "$1"),
        to_email: visitorEmail,
        subject: autoReplySubject,
        text: autoReplyPlain,
        html: autoReplyHtml,
        resend_email_id: autoReplyRes.ok ? autoReplyRes.id : null,
      });
    }

    return NextResponse.json(
      { ok: true, inquiryId: (inquiry as { id: string }).id, threaded: !!replyTo },
      { headers: CORS }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS });
  }
}

