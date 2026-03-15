/**
 * Public Connect Card submission endpoint.
 * Called from /connect/[orgSlug] — no auth required.
 * Stores the inquiry in website_form_inquiries (form_kind = "connect_card"),
 * upserts the person into organization_contacts, and emails the org.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, DEFAULT_FROM } from "@/lib/email/resend";
import { upsertOrganizationContact } from "@/lib/organization-contacts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalize(s: unknown, max = 200): string | null {
  if (typeof s !== "string") return null;
  const v = s.trim();
  return v ? v.slice(0, max) : null;
}

function normalizeEmail(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const v = s.trim().toLowerCase();
  if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const orgSlug = normalize(body?.orgSlug) ?? "";
    const orgIdParam = normalize(body?.orgId) ?? "";
    if (!orgSlug && !orgIdParam) {
      return NextResponse.json({ error: "orgSlug or orgId required" }, { status: 400, headers: CORS });
    }

    const email = normalizeEmail(body?.email);
    if (!email) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400, headers: CORS });
    }

    const firstName  = normalize(body?.firstName) ?? "";
    const lastName   = normalize(body?.lastName) ?? "";
    const fullName   = [firstName, lastName].filter(Boolean).join(" ") || null;
    const phone      = normalize(body?.phone);
    const address    = normalize(body?.address, 300);
    const city       = normalize(body?.city);
    const state      = normalize(body?.state, 50);
    const zip        = normalize(body?.zip, 20);
    const visitType  = normalize(body?.visitType, 60);
    const marital    = normalize(body?.marital, 60);
    const birthday   = normalize(body?.birthday, 20);
    const children   = normalize(body?.children, 10);
    const howHeard   = normalize(body?.howHeard, 200);
    const prayer     = normalize(body?.prayer, 2000);
    const ministries = Array.isArray(body?.ministries)
      ? (body.ministries as unknown[]).filter((x): x is string => typeof x === "string").join(", ")
      : null;

    const supabase = createServiceClient();

    // Prefer lookup by ID (guaranteed unique), fall back to slug for legacy submissions
    const orgQuery = orgIdParam
      ? supabase
          .from("organizations")
          .select("id, name, slug, owner_user_id, website_forms_forward_to_email, website_forms_reply_name")
          .eq("id", orgIdParam)
          .maybeSingle()
      : supabase
          .from("organizations")
          .select("id, name, slug, owner_user_id, website_forms_forward_to_email, website_forms_reply_name")
          .eq("slug", orgSlug)
          .maybeSingle();

    const { data: org } = await orgQuery;

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404, headers: CORS });
    }

    const orgId   = (org as { id: string }).id;
    const resolvedSlug = (org as { slug?: string }).slug ?? orgSlug;
    const orgName = (org as { name?: string }).name ?? "Organization";

    // Resolve forwarding email
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
        forwardToEmail = p?.business_email ?? p?.email ?? null;
      }
    }

    const replyName =
      (org as { website_forms_reply_name?: string | null }).website_forms_reply_name ?? orgName;

    const threadToken = crypto.randomBytes(16).toString("base64url");
    const inboundDomain =
      process.env.RESEND_INBOUND_DOMAIN?.trim() || process.env.RESEND_RECEIVE_DOMAIN?.trim() || "";
    const replyTo = inboundDomain ? `reply+${threadToken}@${inboundDomain}` : null;

    // Build fields map for storage
    const fields: Record<string, string> = {};
    if (firstName)  fields["First name"]           = firstName;
    if (lastName)   fields["Last name"]            = lastName;
    if (phone)      fields["Phone"]                = phone;
    if (address)    fields["Street address"]       = address;
    if (city)       fields["City"]                 = city ?? "";
    if (state)      fields["State"]                = state ?? "";
    if (zip)        fields["ZIP"]                  = zip ?? "";
    if (visitType)  fields["Visitor type"]         = visitType;
    if (marital)    fields["Marital status"]       = marital;
    if (birthday)   fields["Birthday"]             = birthday;
    if (children)   fields["Number of children"]   = children;
    if (ministries) fields["Ministry interests"]   = ministries;
    if (howHeard)   fields["How did you hear?"]    = howHeard;
    if (prayer)     fields["Prayer request / note"] = prayer;

    const subject = `New Connect Card — ${fullName ?? email}`;

    const fieldRows = Object.entries(fields)
      .map(([k, v]) => `<tr><td style="padding:4px 10px 4px 0;font-weight:600;color:#334155;vertical-align:top;white-space:nowrap;">${escapeHtml(k)}</td><td style="padding:4px 0;color:#0f172a;">${escapeHtml(v)}</td></tr>`)
      .join("");

    const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
  <body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;">
      <strong style="color:#15803d;">New Connect Card submitted</strong>
    </div>
    <p style="margin:0 0 16px;"><strong>From:</strong> ${escapeHtml(fullName ? `${fullName} <${email}>` : email)}</p>
    <table style="border-collapse:collapse;width:100%;">
      ${fieldRows}
    </table>
    <p style="margin-top:20px;color:#64748b;font-size:13px;">
      View all submissions in your Exchange dashboard under <strong>Connect Card</strong>.
    </p>
  </body>
</html>`;

    // Store inquiry
    const { data: inquiry, error: inquiryErr } = await supabase
      .from("website_form_inquiries")
      .insert({
        organization_id: orgId,
        org_slug: resolvedSlug,
        page_slug: "connect",
        form_kind: "connect_card",
        visitor_name: fullName,
        visitor_email: email,
        visitor_phone: phone,
        subject,
        fields,
        thread_token: threadToken,
      })
      .select("id")
      .single();

    if (inquiryErr || !inquiry) {
      return NextResponse.json(
        { error: inquiryErr?.message ?? "Failed to store submission" },
        { status: 500, headers: CORS }
      );
    }

    // Upsert into People CRM
    upsertOrganizationContact(supabase, {
      organizationId: orgId,
      email,
      name: fullName,
      phone,
      source: "form",
      formKind: "connect_card",
    }).catch((e) => console.error("[connect-card] upsertOrganizationContact failed:", e));

    // Email the org (best-effort)
    if (forwardToEmail) {
      await sendEmail({
        to: forwardToEmail,
        subject,
        html,
        from: `${replyName} via Exchange <${DEFAULT_FROM.replace(/.*<([^>]+)>.*/, "$1").trim()}>`,
        replyTo: replyTo ?? undefined,
      }).catch((e) => console.error("[connect-card] sendEmail failed:", e));
    }

    // Auto-reply to submitter
    const displayName = firstName || fullName || "there";
    const autoReplyHtml = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
    <p>Hi ${escapeHtml(displayName)},</p>
    <p>Thanks for filling out a Connect Card! We're so glad you reached out.</p>
    <p>Someone from our team will be in touch with you soon. In the meantime, don't hesitate to reply to this email if you have any questions.</p>
    <p style="margin-top:24px;color:#64748b;">— ${escapeHtml(orgName)}</p>
  </body>
</html>`;

    await sendEmail({
      to: email,
      subject: `Thanks for connecting with ${orgName}!`,
      html: autoReplyHtml,
      from: `${replyName} via Exchange <${DEFAULT_FROM.replace(/.*<([^>]+)>.*/, "$1").trim()}>`,
      replyTo: forwardToEmail ?? undefined,
    }).catch((e) => console.error("[connect-card] auto-reply failed:", e));

    return NextResponse.json(
      { ok: true, inquiryId: (inquiry as { id: string }).id },
      { headers: CORS }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS });
  }
}
