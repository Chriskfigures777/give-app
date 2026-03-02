import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const webhookSecret = process.env.UNIT_WEBHOOK_SECRET;

/**
 * Unit Webhook Handler
 *
 * Receives customer.created and other events when users complete the banking
 * application. Saves unit_customer_id to user_profiles so the banking page
 * can fetch a customer token.
 *
 * Configure in Unit Dashboard: Developer → Webhooks → Create
 * URL: https://your-domain.com/api/webhooks/unit
 * Token: same as UNIT_WEBHOOK_SECRET
 *
 * @see https://unit.co/docs/api/webhooks/
 * @see https://www.unit.co/docs/ready-to-launch/banking/advanced-implementation/#webhook-events
 */
function verifyUnitSignature(body: string, signature: string): boolean {
  if (!webhookSecret) return false;
  const expected = createHmac("sha1", webhookSecret).update(body).digest("base64");
  return signature === expected;
}

type UnitWebhookEvent = {
  id: string;
  type: string;
  attributes?: {
    userIds?: string[];
    userId?: string;
    createdAt?: string;
    name?: string;
  };
  relationships?: {
    customer?: {
      data?: { id: string; type: string };
    };
  };
};

type UnitWebhookPayload = {
  data: UnitWebhookEvent | UnitWebhookEvent[];
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-unit-signature");

  if (!body) {
    return NextResponse.json({ error: "Missing body" }, { status: 400 });
  }

  if (!webhookSecret) {
    console.error("[unit-webhook] UNIT_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (signature && !verifyUnitSignature(body, signature)) {
    console.error("[unit-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: UnitWebhookPayload;
  try {
    payload = JSON.parse(body) as UnitWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = Array.isArray(payload.data) ? payload.data : [payload.data];
  const supabase = createServiceClient();

  for (const event of events) {
    if (event.type !== "customer.created") continue;

    const userIds = event.attributes?.userIds ?? (event.attributes?.userId ? [event.attributes.userId] : []);
    const customerData = event.relationships?.customer?.data;
    const unitCustomerId = customerData?.id;

    if (!unitCustomerId || userIds.length === 0) {
      console.warn("[unit-webhook] customer.created missing userIds or customer id", event);
      continue;
    }

    // userIds are JWT sub values = Supabase user UUIDs (auth.users.id)
    for (const userId of userIds) {
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("user_profiles")
          // @ts-ignore – unit_customer_id not in generated types yet
          .update({ unit_customer_id: unitCustomerId })
          .eq("id", userId);
        if (error) console.error("[unit-webhook] Failed to update user_profiles", userId, error);
      } else {
        const { error } = await supabase
          .from("user_profiles")
          // @ts-ignore – unit_customer_id not in generated types yet
          .insert({ id: userId, unit_customer_id: unitCustomerId, role: "donor" });
        if (error) console.error("[unit-webhook] Failed to insert user_profile with unit_customer_id", userId, error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
