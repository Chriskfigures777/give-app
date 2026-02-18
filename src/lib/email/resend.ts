/**
 * Resend email service. Server-side only. Never expose API key to client.
 * Works in Next.js API routes and AWS Lambda.
 */

import { Resend } from "resend";

const API_KEY =
  process.env.RESEND_API_KEY?.trim() ||
  process.env.Resend_API_Key?.trim() ||
  "";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(API_KEY);
  }
  return _resend;
}

const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL?.trim() || "Give <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.DOMAIN || "http://localhost:3000";

export { DEFAULT_FROM, APP_URL };

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Send an email via Resend. Fails gracefully — never throws.
 * Email failure must not break payments or webhooks.
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping send");
    return { ok: false, error: "Resend not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: params.from ?? DEFAULT_FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    });

    if (error) {
      console.error("[email] send failed:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id ?? "unknown" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] send error:", msg);
    return { ok: false, error: msg };
  }
}
