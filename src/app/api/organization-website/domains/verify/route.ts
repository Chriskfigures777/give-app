import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { addRoute53Cname } from "@/lib/route53";
import {
  addCloudFrontDomain,
  getCertificateStatus,
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

async function verifyDns(domain: string): Promise<boolean> {
  const isRoot = !domain.startsWith("www.");
  const cloudFront = cfDomain().toLowerCase();

  // Check CNAME (works for CloudFront and Vercel targets)
  try {
    const records = await dns.resolveCname(domain);
    const target = cnameTarget().toLowerCase();
    if (records.some((r) => r.toLowerCase().endsWith(target) || r.toLowerCase() === target)) return true;
    // Also check CloudFront domain
    if (cloudFront && records.some((r) => r.toLowerCase().endsWith(cloudFront) || r.toLowerCase() === cloudFront)) return true;
  } catch { /* fall through */ }

  // For root/apex domains, check A record pointing to Vercel IP
  if (isRoot) {
    try {
      const aRecords = await dns.resolve4(domain);
      if (aRecords.some((ip) => ip === VERCEL_IP)) return true;
    } catch { /* not found */ }
  }

  return false;
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
        // Don't fail the whole request – fall through to DNS check
      }
    }

    const verified = await verifyDns(domain);

    if (verified) {
      await supabase
        .from("organization_domains")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          dns_provider: "route53",
          updated_at: new Date().toISOString(),
        })
        .eq("id", domainId);

      // If AWS hosting is configured, add domain to CloudFront + update domain map
      if (isHostingConfigured()) {
        const { data: domRow } = await supabase
          .from("organization_domains")
          .select("acm_cert_arn")
          .eq("id", domainId)
          .single();

        const certArn = (domRow as { acm_cert_arn?: string } | null)?.acm_cert_arn;
        if (certArn) {
          const certStatus = await getCertificateStatus(certArn);
          if (certStatus.status === "ISSUED") {
            const cfResult = await addCloudFrontDomain(domain, certArn);
            if (!cfResult.ok) console.warn("CloudFront add domain error:", cfResult.error);
          }
        }

        // Rebuild domain map with all verified domains
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
            if (slug) domainMap[(m as { domain: string }).domain] = slug as string;
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

    return NextResponse.json({
      verified,
      message: verified
        ? "Domain verified successfully"
        : "DNS record not found yet. Changes can take a few minutes to propagate (up to 48 hours in rare cases).",
    });
  } catch (e) {
    console.error("organization-website domains verify error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
