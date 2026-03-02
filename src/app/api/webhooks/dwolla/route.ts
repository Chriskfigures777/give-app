import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const webhookSecret = process.env.DWOLLA_WEBHOOK_SECRET;

type DwollaEvent = {
  id: string;
  created: string;
  topic: string;
  resourceId: string;
  _links?: {
    resource?: { href: string };
  };
};

function verifyDwollaSignature(body: string, signature: string): boolean {
  if (!webhookSecret) return false;
  const expected = createHmac("sha256", webhookSecret).update(body).digest("hex");
  return signature === expected;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("X-Request-Signature-SHA-256");
  const topic = req.headers.get("X-Dwolla-Topic");

  if (!signature || !body) {
    return NextResponse.json({ error: "Missing signature or body" }, { status: 400 });
  }

  if (!webhookSecret) {
    console.error("[dwolla-webhook] DWOLLA_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!verifyDwollaSignature(body, signature)) {
    console.error("[dwolla-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: DwollaEvent;
  try {
    event = JSON.parse(body) as DwollaEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const transferTopics = [
    "transfer:created",
    "transfer:pending",
    "transfer:processed",
    "transfer:failed",
    "transfer:returned",
  ];

  if (!transferTopics.includes(event.topic)) {
    return NextResponse.json({ received: true });
  }

  const resourceHref = event._links?.resource?.href;
  const transferId = (resourceHref ? resourceHref.split("/").pop() : event.resourceId) ?? "";

  if (!transferId) {
    return NextResponse.json({ received: true });
  }

  const { data: existingEvent } = await supabase
    .from("dwolla_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ received: true });
  }

  await supabase.from("dwolla_webhook_events").insert({
    id: event.id,
    topic: event.topic,
    resource_id: transferId,
    created_at: event.created,
  });

  const { data: transferRows } = await supabase
    .from("dwolla_transfers")
    .select("id, status, dwolla_transfer_url")
    .ilike("dwolla_transfer_url", `%${transferId}%`);

  const transferRow =
    Array.isArray(transferRows) && transferRows.length > 0
      ? (transferRows[0] as { id: string; status: string })
      : null;

  if (!transferRow) {
    return NextResponse.json({ received: true });
  }

  const t = transferRow as { id: string; status: string };
  let newStatus: string | null = null;

  switch (event.topic) {
    case "transfer:created":
    case "transfer:pending":
      newStatus = "processing";
      break;
    case "transfer:processed":
      newStatus = "completed";
      break;
    case "transfer:failed":
    case "transfer:returned":
      newStatus = "failed";
      break;
  }

  if (newStatus) {
    await supabase
      .from("dwolla_transfers")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", t.id);
  }

  return NextResponse.json({ received: true });
}
