/**
 * Transactional email senders. Call these from webhooks/handlers after DB writes succeed.
 * Idempotent: safe to retry. Email failure does not break the flow.
 */

import { sendEmail, APP_URL } from "./resend";
import {
  donationReceivedHtml,
  receiptAttachedHtml,
  payoutProcessedHtml,
  confirmEmailHtml,
  orgDonationReceivedHtml,
} from "./templates";
import type { SupabaseClient } from "@supabase/supabase-js";

const ENTITY_DONATION = "donation";
const ENTITY_PAYOUT = "payout";
const ENTITY_SIGNUP = "signup";

const TYPE_DONATION_RECEIVED = "donation_received";
const TYPE_RECEIPT_ATTACHED = "receipt_attached";
const TYPE_ORG_DONATION_RECEIVED = "org_donation_received";
const TYPE_PAYOUT_PROCESSED = "payout_processed";
const TYPE_CONFIRM_EMAIL = "confirm_email";

/** Check if we already sent this email (idempotency). */
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

/** Record that we sent this email (idempotency). */
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

/**
 * Send Donation Received email. Call after donation insert succeeds.
 * Idempotent: skips if already sent for this donation.
 */
export async function sendDonationReceived(params: {
  supabase: SupabaseClient;
  donationId: string;
  donorEmail: string | null;
  donorName: string | null;
  amountCents: number;
  currency: string;
  organizationName: string;
  createdAt: string;
}): Promise<void> {
  if (!params.donorEmail?.trim()) return;

  const already = await alreadySent(
    params.supabase,
    ENTITY_DONATION,
    params.donationId,
    TYPE_DONATION_RECEIVED
  );
  if (already) return;

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

  const result = await sendEmail({
    to: params.donorEmail,
    subject: `Donation confirmation – ${params.organizationName}`,
    html: donationReceivedHtml({
      donorName: params.donorName,
      amountFormatted,
      organizationName: params.organizationName,
      dateFormatted,
    }),
  });

  if (result.ok) {
    await recordSent(
      params.supabase,
      ENTITY_DONATION,
      params.donationId,
      TYPE_DONATION_RECEIVED
    );
  }
}

/**
 * Send Receipt Attached email. Call after donation is stored and receipt is available.
 * Idempotent: skips if already sent for this donation.
 */
export async function sendReceiptAttached(params: {
  supabase: SupabaseClient;
  donationId: string;
  donorEmail: string | null;
  donorName: string | null;
  amountCents: number;
  currency: string;
  organizationName: string;
  createdAt: string;
  /** When provided, appended to receipt URL for token-based access (anonymous donors) */
  receiptToken?: string | null;
}): Promise<void> {
  if (!params.donorEmail?.trim()) return;

  const already = await alreadySent(
    params.supabase,
    ENTITY_DONATION,
    params.donationId,
    TYPE_RECEIPT_ATTACHED
  );
  if (already) return;

  const amount = params.amountCents / 100;
  const amountFormatted =
    params.currency.toUpperCase() === "USD"
      ? `$${amount.toFixed(2)}`
      : `${amount.toFixed(2)} ${params.currency.toUpperCase()}`;
  const dateFormatted = new Date(params.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const baseUrl = `${APP_URL.replace(/\/$/, "")}/receipts/${params.donationId}`;
  const receiptUrl = params.receiptToken
    ? `${baseUrl}?token=${encodeURIComponent(params.receiptToken)}`
    : baseUrl;

  const result = await sendEmail({
    to: params.donorEmail,
    subject: `Your receipt – ${params.organizationName}`,
    html: receiptAttachedHtml({
      donorName: params.donorName,
      amountFormatted,
      organizationName: params.organizationName,
      receiptId: params.donationId,
      receiptUrl,
      dateFormatted,
    }),
  });

  if (result.ok) {
    await recordSent(
      params.supabase,
      ENTITY_DONATION,
      params.donationId,
      TYPE_RECEIPT_ATTACHED
    );
  }
}

/**
 * Send New Donation Received email to organization owner.
 * Call after donation insert succeeds. Idempotent.
 */
export async function sendOrgDonationReceived(params: {
  supabase: SupabaseClient;
  donationId: string;
  organizationId: string;
  organizationName: string;
  amountCents: number;
  currency: string;
  donorName: string | null;
  donorEmail: string | null;
  createdAt: string;
  adminEmail: string;
}): Promise<void> {
  const already = await alreadySent(
    params.supabase,
    ENTITY_DONATION,
    params.donationId,
    TYPE_ORG_DONATION_RECEIVED
  );
  if (already) return;

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

  const result = await sendEmail({
    to: params.adminEmail,
    subject: `New donation received – ${params.organizationName}`,
    html: orgDonationReceivedHtml({
      organizationName: params.organizationName,
      amountFormatted,
      donorNameOrEmail,
      dateFormatted,
    }),
  });

  if (result.ok) {
    await recordSent(
      params.supabase,
      ENTITY_DONATION,
      params.donationId,
      TYPE_ORG_DONATION_RECEIVED
    );
  }
}

/**
 * Send Payout Processed email to organization admin.
 * Idempotent: skips if already sent for this payout.
 */
export async function sendPayoutProcessed(params: {
  supabase: SupabaseClient;
  payoutId: string;
  organizationId: string;
  organizationName: string;
  amountCents: number;
  currency: string;
  destination: string;
  arrivalDate: string;
  adminEmail: string;
}): Promise<void> {
  const already = await alreadySent(
    params.supabase,
    ENTITY_PAYOUT,
    params.payoutId,
    TYPE_PAYOUT_PROCESSED
  );
  if (already) return;

  const amount = params.amountCents / 100;
  const amountFormatted =
    params.currency.toUpperCase() === "USD"
      ? `$${amount.toFixed(2)}`
      : `${amount.toFixed(2)} ${params.currency.toUpperCase()}`;
  const dateFormatted = new Date(params.arrivalDate).toLocaleDateString(
    undefined,
    { year: "numeric", month: "long", day: "numeric" }
  );

  const result = await sendEmail({
    to: params.adminEmail,
    subject: `Payout processed – ${params.organizationName}`,
    html: payoutProcessedHtml({
      organizationName: params.organizationName,
      amountFormatted,
      destination: params.destination,
      dateFormatted,
    }),
  });

  if (result.ok) {
    await recordSent(
      params.supabase,
      ENTITY_PAYOUT,
      params.payoutId,
      TYPE_PAYOUT_PROCESSED
    );
  }
}

/**
 * Send Confirm Your Email. Call when user signs up and confirmation is required.
 * Uses Supabase's confirmation link. Idempotent by email+type (optional).
 */
export async function sendConfirmEmail(params: {
  supabase: SupabaseClient;
  email: string;
  confirmUrl: string;
  expiresInHours?: number;
}): Promise<void> {
  const idempotencyKey = `signup:${params.email}`;
  const already = await alreadySent(
    params.supabase,
    ENTITY_SIGNUP,
    idempotencyKey,
    TYPE_CONFIRM_EMAIL
  );
  if (already) return;

  const result = await sendEmail({
    to: params.email,
    subject: "Confirm your email",
    html: confirmEmailHtml({
      confirmUrl: params.confirmUrl,
      expiresInHours: params.expiresInHours ?? 24,
    }),
  });

  if (result.ok) {
    await recordSent(
      params.supabase,
      ENTITY_SIGNUP,
      idempotencyKey,
      TYPE_CONFIRM_EMAIL
    );
  }
}
