import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { createClient } from "@supabase/supabase-js";

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  return createClient(url, key);
}

function jsonResponse(statusCode: number, body: object): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  let body: string;
  if (event.isBase64Encoded && event.body) {
    body = Buffer.from(event.body, "base64").toString("utf-8");
  } else {
    body = event.body ?? "";
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(body) as WebhookPayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  if (!payload?.type || !payload?.table) {
    return jsonResponse(400, { error: "Invalid webhook payload" });
  }

  const supabase = getSupabase();

  try {
    if (payload.type === "INSERT") {
      switch (payload.table) {
        case "donations": {
          const record = payload.record as {
            id: string;
            organization_id: string;
            amount_cents: number;
            campaign_id?: string | null;
            created_at?: string;
          };
          const orgId = record.organization_id;
          if (!orgId) break;

          const { data: org } = await supabase
            .from("organizations")
            .select("name, slug, city, state")
            .eq("id", orgId)
            .single();

          const orgRow = org as { name: string; slug: string; city: string | null; state: string | null } | null;
          const orgName = orgRow?.name ?? "Organization";
          const orgSlug = orgRow?.slug ?? "";

          await supabase.from("feed_items").insert({
            item_type: "donation",
            organization_id: orgId,
            payload: {
              amount_cents: record.amount_cents ?? 0,
              organization_name: orgName,
              organization_slug: orgSlug,
              campaign_id: record.campaign_id,
              created_at: record.created_at,
            },
          });
          break;
        }

        case "peer_requests": {
          const record = payload.record as {
            id: string;
            requester_id: string;
            requester_type: string;
            recipient_id: string;
            recipient_type: string;
          };
          if (record.recipient_type !== "organization") break;

          const { data: requesterOrg } = await supabase
            .from("organizations")
            .select("name, slug")
            .eq("id", record.requester_id)
            .single();

          const { data: recipientOrg } = await supabase
            .from("organizations")
            .select("id, name, slug, owner_user_id")
            .eq("id", record.recipient_id)
            .single();

          const reqOrg = requesterOrg as { name: string; slug: string } | null;
          const recOrg = recipientOrg as { id: string; name: string; slug: string; owner_user_id: string | null } | null;
          const ownerUserId = recOrg?.owner_user_id;
          const orgName = reqOrg?.name ?? "Organization";
          const orgSlug = reqOrg?.slug ?? "";

          if (ownerUserId) {
            await supabase.from("notifications").insert({
              user_id: ownerUserId,
              type: "connection_request",
              payload: {
                peer_request_id: record.id,
                organization_id: record.requester_id,
                organization_name: orgName,
                organization_slug: orgSlug,
              },
            });
          }

          await supabase.from("feed_items").insert({
            item_type: "connection_request",
            organization_id: record.requester_id,
            payload: {
              peer_request_id: record.id,
              organization_name: orgName,
              organization_slug: orgSlug,
            },
          });
          break;
        }

        case "organizations": {
          const record = payload.record as {
            id: string;
            name: string;
            slug: string;
            logo_url?: string | null;
            profile_image_url?: string | null;
            city?: string | null;
            state?: string | null;
          };
          const orgId = record.id;
          if (!orgId) break;

          await supabase.from("feed_items").insert({
            item_type: "new_org",
            organization_id: orgId,
            payload: {
              organization_name: record.name,
              organization_slug: record.slug,
              profile_image_url: record.profile_image_url ?? null,
              logo_url: record.logo_url ?? null,
              city: record.city ?? null,
              state: record.state ?? null,
              created_at: new Date().toISOString(),
            },
          });
          break;
        }

        default:
          break;
      }
    }
  } catch (err) {
    console.error("Feed webhook error:", err instanceof Error ? err.message : err);
    return jsonResponse(500, { error: "Processing failed" });
  }

  return jsonResponse(200, { received: true });
}
