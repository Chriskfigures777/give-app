/**
 * Twilio SMS helper for the CRM module.
 * Server-side only. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in env.
 * Fails gracefully — never throws, always returns SendSmsResult.
 */

export type SendSmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string };

/**
 * Send a single SMS via Twilio REST API.
 * Avoids importing the full twilio SDK to keep bundle size small.
 */
export async function sendSms(params: {
  to: string;
  body: string;
}): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    console.warn("[sms] Twilio not configured — skipping send");
    return { ok: false, error: "Twilio not configured" };
  }

  const toNormalized = normalizePhone(params.to);
  if (!toNormalized) {
    return { ok: false, error: "Invalid phone number" };
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: from,
          To: toNormalized,
          Body: params.body,
        }).toString(),
      }
    );

    const data = await res.json() as { sid?: string; message?: string; code?: number };

    if (!res.ok) {
      const msg = data.message ?? `Twilio error ${res.status}`;
      console.error("[sms] send failed:", msg);
      return { ok: false, error: msg };
    }

    return { ok: true, sid: data.sid! };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sms] send error:", msg);
    return { ok: false, error: msg };
  }
}

/**
 * Send the same SMS to multiple numbers. Returns aggregate stats.
 * Sends sequentially to avoid Twilio rate limits.
 */
export async function sendSmsBatch(params: {
  to: string[];
  body: string;
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const phone of params.to) {
    const result = await sendSms({ to: phone, body: params.body });
    if (result.ok) {
      sent++;
    } else {
      failed++;
      errors.push(`${phone}: ${result.error}`);
    }
  }

  return { sent, failed, errors };
}

/** Normalise a phone number to E.164 (+1XXXXXXXXXX). Returns null if unparseable. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 7) return `+${digits}`; // international
  return null;
}
