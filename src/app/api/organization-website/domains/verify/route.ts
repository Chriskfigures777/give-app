import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { addRoute53Cname } from "@/lib/route53";
import {
  addCloudFrontDomain,
  getCertificateStatus,
  requestCertificate,
  isHostingConfigured,
  updateDomainMap,
} from "@/lib/aws-hosting";
import dns from "dns/promises";

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

const cnameTarget = () =>
  process.env.SITE_CNAME_TARGET || "give-app78.vercel.app";
const cfDomain = () => process.env.AWS_CLOUDFRONT_DOMAIN || "";
const VERCEL_IP = "76.76.21.21";

/**
 * Check if either the domain itself or www.domain has a CNAME pointing
 * to CloudFront or Vercel. For root domains we also check www variant
 * because registrars can't set CNAME on root.
 */
async function verifyDns(domain: string): Promise<{ verified: boolean; verifiedDomain?: string }> {
  const cloudFront = cfDomain().toLowerCase();
  const target = cnameTarget().toLowerCase();
  const isRoot = !domain.startsWith("www.");

  // Helper: check if a domain's CNAME resolves to our targets
  async function checkCname(d: string): Promise<boolean> {
    try {
      const records = await dns.resolveCname(d);
      for (const r of records) {
        const rl = r.toLowerCase();
        if (rl === target || rl.endsWith("." + target)) return true;
        if (cloudFront && (rl === cloudFront || rl.endsWith("." + cloudFront))) return true;
      }
    } catch { /* not found */ }
    return false;
  }

  // Check the exact domain first
  if (await checkCname(domain)) return { verified: true, verifiedDomain: domain };

  // For root domains, also check www variant (most common setup)
  if (isRoot) {
    if (await checkCname("www." + domain)) return { verified: true, verifiedDomain: "www." + domain };

    // Fallback: check A record pointing to Vercel IP (legacy/non-CloudFront)
    try {
      const aRecords = await dns.resolve4(domain);
      if (aRecords.some((ip) => ip === VERCEL_IP)) return { verified: true, verifiedDomain: domain };
    } catch { /* not found */ }
  }

  return { verified: false };
}

/** POST: Verify domain DNS and optionally auto-add CNAME via Route 53 */
export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const body = await req.json();
    const { organizationId, domainId, tryRoute53 } = body;

    // Also accept legacy `tryGodaddy` param for backwards compatibility
    const shouldAutoAdd = tryRoute53 || body.tryGodaddy;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }
    if (!domainId) {
      return NextResponse.json({ error: "domainId required" }, { status: 400 });
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

    const { data: row, error: fetchErr } = await supabase
      .from("organization_domains")
      .select("id, domain, organization_id")
      .eq("id", domainId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (fetchErr || !row) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const domain = (row as { domain: string }).domain;

    // Auto-add CNAME via Route 53 if requested
    if (shouldAutoAdd && domain.startsWith("www.")) {
      const apexDomain = domain.replace(/^www\./, "");
      const result = await addRoute53Cname(apexDomain, "www", cnameTarget());
      if (!result.ok) {
        console.warn("Route 53 auto-CNAME failed:", result.error);
      }
    }

    const dnsResult = await verifyDns(domain);
    const dnsVerified = dnsResult.verified;
    const verifiedDomain = dnsResult.verifiedDomain;

    // Collect ACM cert status for the response
    let acmStatus = "UNKNOWN";
    let acmValidationRecords: Array<{ type: string; name: string; value: string; domain?: string; status?: string }> = [];
    let certArn: string | undefined;

    if (isHostingConfigured()) {
      const { data: domRow } = await supabase
        .from("organization_domains")
        .select("acm_cert_arn")
        .eq("id", domainId)
        .single();

      certArn = (domRow as { acm_cert_arn?: string } | null)?.acm_cert_arn ?? undefined;

      // If no cert yet, request one
      if (!certArn) {
        const apexForCert = domain.startsWith("www.") ? domain.replace(/^www\./, "") : domain;
        const certResult = await requestCertificate(apexForCert);
        if (certResult.ok && certResult.certArn) {
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
      }

      // Check cert status
      if (certArn) {
        const certStatus = await getCertificateStatus(certArn);
        acmStatus = certStatus.status;

        // Also fetch fresh validation records if we didn't request a new cert above
        if (acmValidationRecords.length === 0) {
          const apexForCert = domain.startsWith("www.") ? domain.replace(/^www\./, "") : domain;
          const certResult = await requestCertificate(apexForCert);
          if (certResult.validationRecords) {
            acmValidationRecords = certResult.validationRecords.map((r) => ({
              type: "CNAME",
              name: r.name.replace(/\.$/, ""),
              value: r.value.replace(/\.$/, ""),
              domain: r.domain,
              status: r.status,
            }));
          }
        }
      }
    }

    if (dnsVerified) {
      await supabase
        .from("organization_domains")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          dns_provider: "route53",
          updated_at: new Date().toISOString(),
        })
        .eq("id", domainId);

      // If AWS hosting is configured, add domain(s) to CloudFront + update domain map
      if (isHostingConfigured() && certArn && acmStatus === "ISSUED") {
        // Add the domain stored in DB
        const cfResult = await addCloudFrontDomain(domain, certArn);
        if (!cfResult.ok) console.warn("CloudFront add domain error:", cfResult.error);

        // For root domains also add www, and vice versa
        const isRoot = !domain.startsWith("www.");
        const altDomain = isRoot ? "www." + domain : domain.replace(/^www\./, "");
        const cfResult2 = await addCloudFrontDomain(altDomain, certArn);
        if (!cfResult2.ok) console.warn("CloudFront add alt domain:", cfResult2.error);

        // Rebuild domain map
        const { data: allMappings } = await supabase
          .from("organization_domains")
          .select("domain, organization_id")
          .eq("status", "verified");

        if (allMappings) {
          const { data: allOrgs } = await supabase
            .from("organizations")
            .select("id, slug, published_website_project_id")
            .not("published_website_project_id", "is", null);

          const orgMap = new Map((allOrgs ?? []).map((o: { id: string; slug?: string }) => [o.id, o.slug]));
          const domainMap: Record<string, string> = {};
          for (const m of allMappings) {
            const slug = orgMap.get((m as { organization_id: string }).organization_id);
            if (slug) {
              const d = (m as { domain: string }).domain;
              domainMap[d] = slug as string;
              // Also add the www/root variant
              const isR = !d.startsWith("www.");
              domainMap[isR ? "www." + d : d.replace(/^www\./, "")] = slug as string;
            }
          }
          await updateDomainMap(domainMap);
        }
      }
    } else {
      await supabase
        .from("organization_domains")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", domainId);
    }

    // Build a helpful message
    let message: string;
    if (dnsVerified && acmStatus === "ISSUED") {
      message = "Domain verified and SSL certificate active! Your site is live.";
    } else if (dnsVerified && acmStatus === "PENDING_VALIDATION") {
      message = "DNS verified! However, your SSL certificate is still pending. Please add the SSL validation CNAME records shown above to enable HTTPS.";
    } else if (dnsVerified) {
      message = "Domain DNS verified successfully.";
    } else {
      message = "DNS record not found yet. Make sure you've added the CNAME record at your domain registrar. Changes can take a few minutes to propagate (up to 48 hours in rare cases).";
    }

    return NextResponse.json({
      verified: dnsVerified,
      verifiedDomain,
      acmStatus,
      acmValidationRecords,
      sslReady: acmStatus === "ISSUED",
      message,
    });
  } catch (e) {
    console.error("organization-website domains verify error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
