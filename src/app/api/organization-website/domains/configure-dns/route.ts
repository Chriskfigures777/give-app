import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import {
  getHostedZoneForDomain,
  createHostedZone,
  getHostedZoneDetails,
  upsertDnsRecord,
} from "@/lib/route53";
import { requestCertificate, cloudfrontDomain } from "@/lib/aws-hosting";

async function canAccessOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data: org } = await supabase
    .from("organizations")
    .select("owner_user_id")
    .eq("id", orgId)
    .single();
  if ((org as { owner_user_id?: string } | null)?.owner_user_id === userId) return true;
  const { data: admin } = await supabase
    .from("organization_admins")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!admin;
}

/**
 * POST /api/organization-website/domains/configure-dns
 *
 * Automatically configures Route 53 DNS for a custom domain:
 * 1. Finds or creates a Route 53 hosted zone for the apex domain
 * 2. Adds www CNAME → CloudFront distribution
 * 3. Adds ACM SSL validation CNAME records
 *
 * Returns the Route 53 nameservers — the user needs to set these
 * at their domain registrar (e.g. GoDaddy) to activate.
 */
export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const body = await req.json();
    const { organizationId, domainId } = body;

    if (!organizationId || !domainId) {
      return NextResponse.json({ error: "organizationId and domainId required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (profile?.role !== "platform_admin" && organizationId !== orgId) {
      const canAccess = await canAccessOrg(supabase, user.id, organizationId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: domRow } = await supabase
      .from("organization_domains")
      .select("id, domain, acm_cert_arn")
      .eq("id", domainId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!domRow) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const domain = (domRow as { domain: string }).domain;
    const apexDomain = domain.startsWith("www.") ? domain.replace(/^www\./, "") : domain;
    const cfDomain = cloudfrontDomain();
    const addedRecords: string[] = [];

    // 1. Find or create Route 53 hosted zone
    let zone = await getHostedZoneForDomain(apexDomain);
    let zoneCreated = false;
    let nameservers: string[] = [];

    if (!zone) {
      const result = await createHostedZone(apexDomain);
      if (!result) {
        return NextResponse.json({ error: "Failed to create Route 53 hosted zone" }, { status: 500 });
      }
      zone = result.zone;
      nameservers = result.nameservers;
      zoneCreated = true;
    } else {
      const details = await getHostedZoneDetails(zone.id);
      nameservers = details?.nameservers ?? [];
    }

    const zoneId = zone.id;

    // 2. Add www CNAME → CloudFront
    if (cfDomain) {
      const r = await upsertDnsRecord(zoneId, `www.${apexDomain}`, "CNAME", [cfDomain + "."], 300);
      if (r.ok) addedRecords.push(`CNAME  www.${apexDomain}  →  ${cfDomain}`);
      else console.warn("www CNAME error:", r.error);
    }

    // 3. Request/fetch ACM cert and add validation records
    let certArn = (domRow as { acm_cert_arn?: string | null }).acm_cert_arn ?? undefined;
    let acmValidationRecords: Array<{ type: string; name: string; value: string; domain?: string; status?: string }> = [];

    const certResult = await requestCertificate(apexDomain);
    if (certResult.ok && certResult.certArn && !certArn) {
      certArn = certResult.certArn;
      await supabase
        .from("organization_domains")
        .update({ acm_cert_arn: certArn, updated_at: new Date().toISOString() })
        .eq("id", domainId);
    }
    if (certResult.validationRecords) {
      acmValidationRecords = certResult.validationRecords.map((r) => ({
        type: "CNAME",
        name: r.name.replace(/\.$/, ""),
        value: r.value.replace(/\.$/, ""),
        domain: r.domain,
        status: r.status,
      }));
    }

    // 4. Add pending ACM validation CNAMEs to Route 53
    for (const rec of acmValidationRecords) {
      if (rec.status === "SUCCESS") continue;
      const recValue = rec.value.endsWith(".") ? rec.value : rec.value + ".";
      const r = await upsertDnsRecord(zoneId, rec.name + ".", "CNAME", [recValue], 300);
      if (r.ok) addedRecords.push(`CNAME  ${rec.name}  →  (SSL validation)`);
      else console.warn("ACM validation CNAME error:", r.error);
    }

    const message = zoneCreated
      ? `Route 53 zone created. ${addedRecords.length} DNS records added. Update your nameservers at your registrar to activate.`
      : `${addedRecords.length} DNS records added to Route 53. Make sure your domain uses these nameservers at your registrar.`;

    return NextResponse.json({
      ok: true,
      zoneId,
      zoneCreated,
      nameservers,
      addedRecords,
      acmValidationRecords,
      message,
    });
  } catch (e) {
    console.error("configure-dns error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
