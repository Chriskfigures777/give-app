import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const webhookSecret = process.env.ASTRA_CLIENT_SECRET;

/**
 * Astra Webhook Handler
 *
 * Receives automation updates and payment instrument events from Astra Finance.
 * Configure in Astra Dashboard: https://dashboard-sandbox.astra.finance/ (sandbox)
 * or https://dashboard.astra.finance/ (production) → Webhooks section.
 *
 * Webhook URL: https://your-domain.com/api/webhooks/astra
 * Uses ASTRA_CLIENT_SECRET for HMAC-SHA256 verification (Astra-Verification header).
 *
 * @see https://docs.astra.finance/reference/webhooks
 * @see https://docs.astra.finance/reference/webhook-verification
 * @see https://docs.astra.finance/reference/payment-instrument-webhooks
 */
function verifyAstraSignature(body: string, signature: string | null): boolean {
  if (!webhookSecret || !signature) return false;
  try {
    const expected = createHmac("sha256", webhookSecret)
      .update(body, "utf8")
      .digest();
    const received = Buffer.from(signature, "base64");
    return expected.length === received.length && timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

type AstraWebhookPayload = {
  webhook_type: string;
  webhook_id: string;
  user_id?: string | null;
  resource_id?: string;
  metadata?: {
    amount?: number;
    type?: string;
  };
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("Astra-Verification");

  if (!body) {
    return NextResponse.json({ error: "Missing body" }, { status: 400 });
  }

  if (!webhookSecret) {
    console.error("[astra-webhook] ASTRA_CLIENT_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!verifyAstraSignature(body, signature)) {
    console.error("[astra-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: AstraWebhookPayload;
  try {
    payload = JSON.parse(body) as AstraWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { webhook_type, webhook_id, user_id, resource_id, metadata } = payload;

  switch (webhook_type) {
    case "inbound_payment_received":
      // Payment Instrument received ACH or Wires
      console.log("[astra-webhook] inbound_payment_received", {
        webhook_id,
        resource_id,
        amount: metadata?.amount,
        type: metadata?.type,
      });
      // TODO: Update your DB, send notification, etc.
      break;

    case "routine_updated":
      // User automation (routine) was updated
      console.log("[astra-webhook] routine_updated", { webhook_id, user_id, resource_id });
      break;

    default:
      console.log("[astra-webhook] Unhandled event:", webhook_type, webhook_id);
  }

  return NextResponse.json({ received: true });
}
