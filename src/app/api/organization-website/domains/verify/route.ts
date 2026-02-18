import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { addRoute53Cname } from "@/lib/route53";
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
  process.env.SITE_CNAME_TARGET || "cname.vercel-dns.com";

async function verifyDns(domain: string): Promise<boolean> {
  try {
    const records = await dns.resolveCname(domain);
    const target = cnameTarget().toLowerCase();
    return records.some((r) => r.toLowerCase().endsWith(target) || r.toLowerCase() === target);
  } catch {
    return false;
  }
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
        : "CNAME not found yet. DNS can take up to 48 hours to propagate.",
    });
  } catch (e) {
    console.error("organization-website domains verify error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
