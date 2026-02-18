/**
 * Transactional email for Lambda. Minimal copy of app logic.
 * Uses RESEND_API_KEY and NEXT_PUBLIC_APP_URL from env.
 */

import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

const API_KEY =
  process.env.RESEND_API_KEY?.trim() || process.env.Resend_API_Key?.trim() || "";
const FROM = process.env.RESEND_FROM_EMAIL?.trim() || "Give <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.DOMAIN || "http://localhost:3000";

/** Resend allows 2 requests/sec. Use between sends to avoid 429. */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function alreadySent(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string,
  emailType: string
): Promise<boolean> {
  const { data } = await supabase
    .from("email_sends")
    .select("id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("email_type", emailType)
    .maybeSingle();
  return !!data;
}

async function recordSent(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string,
  emailType: string
): Promise<void> {
  await supabase.from("email_sends").insert({
    entity_type: entityType,
    entity_id: entityId,
    email_type: emailType,
  });
}

export async function sendDonationEmails(params: {
  supabase: SupabaseClient;
  donationId: string;
  donorEmail: string | null;
  donorName: string | null;
  amountCents: number;
  currency: string;
  orgName: string;
  createdAt: string;
  receiptToken?: string | null;
}): Promise<void> {
  if (!params.donorEmail?.trim()) return;
  if (!API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping donation emails");
    return;
  }

  const amount = params.amountCents / 100;
  const amountFormatted =
    params.currency.toUpperCase() === "USD"
      ? `$${amount.toFixed(2)}`
      : `${amount.toFixed(2)} ${params.currency.toUpperCase()}`;
  const dateFormatted = new Date(params.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const name = params.donorName ? esc(params.donorName) : "Donor";

  const resend = new Resend(API_KEY);

  if (!(await alreadySent(params.supabase, "donation", params.donationId, "donation_received"))) {
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: params.donorEmail,
        subject: `Donation confirmation – ${params.orgName}`,
        html: `<!DOCTYPE html><html><body style="font-family:system-ui;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
<h1>Thank you for your donation</h1>
<p>Hi ${name},</p>
<p>Your donation has been received and processed.</p>
<p><strong>Amount:</strong> ${esc(amountFormatted)}</p>
<p><strong>Organization:</strong> ${esc(params.orgName)}</p>
<p><strong>Date:</strong> ${esc(dateFormatted)}</p>
<p>Thank you for your support.</p>
</body></html>`,
      });
      if (!error) {
        await recordSent(params.supabase, "donation", params.donationId, "donation_received");
      } else {
        console.error("[email] donation_received Resend error:", error);
      }
    } catch (e) {
      console.error("[email] donation_received failed:", e);
    }
  }

  await sleep(600);

  if (!(await alreadySent(params.supabase, "donation", params.donationId, "receipt_attached"))) {
    const baseUrl = `${APP_URL.replace(/\/$/, "")}/receipts/${params.donationId}`;
    const receiptUrl = params.receiptToken
      ? `${baseUrl}?token=${encodeURIComponent(params.receiptToken)}`
      : baseUrl;
    const dateShort = new Date(params.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: params.donorEmail,
        subject: `Your receipt – ${params.orgName}`,
        html: `<!DOCTYPE html><html><body style="font-family:system-ui;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
<h1>Your donation receipt</h1>
<p>Hi ${name},</p>
<p>Your tax receipt for your donation is ready.</p>
<p><strong>Amount:</strong> ${esc(amountFormatted)}</p>
<p><strong>Organization:</strong> ${esc(params.orgName)}</p>
<p><strong>Date:</strong> ${esc(dateShort)}</p>
<p><strong>Receipt ID:</strong> <code>${esc(params.donationId)}</code></p>
<p><a href="${esc(receiptUrl)}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">View receipt</a></p>
<p style="margin-top:24px;color:#64748b;font-size:0.875rem;">This receipt is for your records. No goods or services were provided in exchange for this donation.</p>
</body></html>`,
      });
      if (!error) {
        await recordSent(params.supabase, "donation", params.donationId, "receipt_attached");
      } else {
        console.error("[email] receipt_attached Resend error:", error);
      }
    } catch (e) {
      console.error("[email] receipt_attached failed:", e);
    }
  }
}

export async function sendOrgDonationEmail(params: {
  supabase: SupabaseClient;
  donationId: string;
  orgName: string;
  amountCents: number;
  currency: string;
  donorName: string | null;
  donorEmail: string | null;
  createdAt: string;
  adminEmail: string;
}): Promise<void> {
  if (!API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping org donation email");
    return;
  }
  if (await alreadySent(params.supabase, "donation", params.donationId, "org_donation_received")) return;

  const amount = params.amountCents / 100;
  const amountFormatted =
    params.currency.toUpperCase() === "USD"
      ? `$${amount.toFixed(2)}`
      : `${amount.toFixed(2)} ${params.currency.toUpperCase()}`;
  const dateFormatted = new Date(params.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const donorNameOrEmail = params.donorName?.trim() || params.donorEmail || "Anonymous";

  const resend = new Resend(API_KEY);
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.adminEmail,
      subject: `New donation received – ${params.orgName}`,
      html: `<!DOCTYPE html><html><body style="font-family:system-ui;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
<h1>New donation received</h1>
<p>Your organization received a new donation.</p>
<p><strong>Organization:</strong> ${esc(params.orgName)}</p>
<p><strong>Amount:</strong> ${esc(amountFormatted)}</p>
<p><strong>From:</strong> ${esc(donorNameOrEmail)}</p>
<p><strong>Date:</strong> ${esc(dateFormatted)}</p>
</body></html>`,
    });
    if (!error) {
      await recordSent(params.supabase, "donation", params.donationId, "org_donation_received");
    } else {
      console.error("[email] org_donation_received Resend error:", error);
    }
  } catch (e) {
    console.error("[email] org_donation_received failed:", e);
  }
}

export async function sendPayoutEmail(params: {
  supabase: SupabaseClient;
  payoutId: string;
  orgId: string;
  orgName: string;
  amountCents: number;
  currency: string;
  destination: string;
  arrivalDate: string;
  adminEmail: string;
}): Promise<void> {
  if (!API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping payout email");
    return;
  }
  if (await alreadySent(params.supabase, "payout", params.payoutId, "payout_processed")) return;

  const amount = params.amountCents / 100;
  const amountFormatted =
    params.currency.toUpperCase() === "USD"
      ? `$${amount.toFixed(2)}`
      : `${amount.toFixed(2)} ${params.currency.toUpperCase()}`;
  const dateFormatted = new Date(params.arrivalDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const resend = new Resend(API_KEY);
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.adminEmail,
      subject: `Payout processed – ${params.orgName}`,
      html: `<!DOCTYPE html><html><body style="font-family:system-ui;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
<h1>Your payout was processed</h1>
<p>Your organization's payout has been completed.</p>
<p><strong>Organization:</strong> ${esc(params.orgName)}</p>
<p><strong>Amount:</strong> ${esc(amountFormatted)}</p>
<p><strong>Destination:</strong> ${esc(params.destination)}</p>
<p><strong>Processing date:</strong> ${esc(dateFormatted)}</p>
<p>Funds should arrive in your bank account within 1–3 business days.</p>
</body></html>`,
    });
    if (!error) {
      await recordSent(params.supabase, "payout", params.payoutId, "payout_processed");
    } else {
      console.error("[email] payout_processed Resend error:", error);
    }
  } catch (e) {
    console.error("[email] payout_processed failed:", e);
  }
}
