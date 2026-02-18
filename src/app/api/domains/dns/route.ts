import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  listHostedZones,
  getHostedZoneForDomain,
  getHostedZoneDetails,
  createHostedZone,
  listDnsRecords,
  upsertDnsRecord,
  deleteDnsRecord,
} from "@/lib/route53";

/**
 * GET /api/domains/dns
 *   ?action=zones                → list all hosted zones
 *   ?action=records&zoneId=XYZ   → list records in a zone
 *   ?action=zone&domain=example.org → get/create zone for a domain
 */
export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireAuth();
    if (profile?.role !== "platform_admin" && profile?.role !== "organization_admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const action = req.nextUrl.searchParams.get("action") ?? "zones";

    if (action === "zones") {
      const zones = await listHostedZones();
      return NextResponse.json({ zones });
    }

    if (action === "records") {
      const zoneId = req.nextUrl.searchParams.get("zoneId");
      if (!zoneId) {
        return NextResponse.json(
          { error: "zoneId required" },
          { status: 400 }
        );
      }
      const records = await listDnsRecords(zoneId);
      return NextResponse.json({ records });
    }

    if (action === "zone") {
      const domain = req.nextUrl.searchParams.get("domain");
      if (!domain) {
        return NextResponse.json(
          { error: "domain required" },
          { status: 400 }
        );
      }
      const zone = await getHostedZoneForDomain(domain);
      if (zone) {
        const details = await getHostedZoneDetails(zone.id);
        return NextResponse.json({
          zone,
          nameservers: details?.nameservers ?? [],
          exists: true,
        });
      }
      return NextResponse.json({ zone: null, exists: false });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("domains/dns GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/domains/dns
 * Body: { action, ... }
 *   action: "create-zone"   → { domain }
 *   action: "upsert-record" → { zoneId, name, type, values, ttl? }
 *   action: "delete-record" → { zoneId, name, type, values, ttl? }
 */
export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireAuth();
    if (profile?.role !== "platform_admin" && profile?.role !== "organization_admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create-zone") {
      const { domain } = body;
      if (!domain) {
        return NextResponse.json(
          { error: "domain required" },
          { status: 400 }
        );
      }

      // Check if zone already exists
      const existing = await getHostedZoneForDomain(domain);
      if (existing) {
        const details = await getHostedZoneDetails(existing.id);
        return NextResponse.json({
          zone: existing,
          nameservers: details?.nameservers ?? [],
          created: false,
          message: "Hosted zone already exists",
        });
      }

      const result = await createHostedZone(domain);
      if (!result) {
        return NextResponse.json(
          { error: "Failed to create hosted zone" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        zone: result.zone,
        nameservers: result.nameservers,
        created: true,
        message: `Hosted zone created. Update your domain registrar NS records to: ${result.nameservers.join(", ")}`,
      });
    }

    if (action === "upsert-record") {
      const { zoneId, name, type, values, ttl } = body;
      if (!zoneId || !name || !type || !values?.length) {
        return NextResponse.json(
          { error: "zoneId, name, type, and values required" },
          { status: 400 }
        );
      }
      const result = await upsertDnsRecord(
        zoneId,
        name,
        type.toUpperCase(),
        values,
        ttl ?? 300
      );
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error ?? "Failed to upsert record" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, message: "Record updated" });
    }

    if (action === "delete-record") {
      const { zoneId, name, type, values, ttl } = body;
      if (!zoneId || !name || !type || !values?.length) {
        return NextResponse.json(
          { error: "zoneId, name, type, and values required" },
          { status: 400 }
        );
      }
      const result = await deleteDnsRecord(
        zoneId,
        name,
        type.toUpperCase(),
        values,
        ttl ?? 300
      );
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error ?? "Failed to delete record" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, message: "Record deleted" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("domains/dns POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
