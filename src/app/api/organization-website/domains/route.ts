import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

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

/** GET: List domains for organization */
export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const organizationId = req.nextUrl.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
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

    const { data, error } = await supabase
      .from("organization_domains")
      .select("id, domain, status, verified_at, dns_provider, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("organization-website domains GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ domains: data ?? [] });
  } catch (e) {
    console.error("organization-website domains GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}

function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  if (d.startsWith("http://")) d = d.slice(7);
  if (d.startsWith("https://")) d = d.slice(8);
  if (d.includes("/")) d = d.split("/")[0];
  return d;
}

/** POST: Add a custom domain */
export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const body = await req.json();
    const { organizationId, domain: rawDomain } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }
    if (!rawDomain || typeof rawDomain !== "string") {
      return NextResponse.json({ error: "domain required" }, { status: 400 });
    }

    const domain = normalizeDomain(rawDomain);
    if (!domain || !domain.includes(".")) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
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

    const cnameTarget = process.env.SITE_CNAME_TARGET || "give-app78.vercel.app";
    const vercelIp = "76.76.21.21";
    const isWww = domain.startsWith("www.");
    const apexDomain = isWww ? domain.replace(/^www\./, "") : domain;
    const recordName = isWww ? "www" : "@";
    const isRoot = recordName === "@";

    const dnsInstructions = isRoot
      ? { type: "A", name: "@", value: vercelIp, message: `Add an A record: @ (root) → ${vercelIp}` }
      : { type: "CNAME", name: recordName, value: cnameTarget, message: `Add a CNAME record: ${recordName} → ${cnameTarget}` };

    const { data: existing } = await supabase
      .from("organization_domains")
      .select("id, organization_id")
      .eq("domain", domain)
      .maybeSingle();

    if (existing) {
      if ((existing as { organization_id: string }).organization_id !== organizationId) {
        return NextResponse.json({ error: "Domain already connected to another organization" }, { status: 409 });
      }
      const { data: d } = await supabase
        .from("organization_domains")
        .select("id, domain, status")
        .eq("id", (existing as { id: string }).id)
        .single();
      return NextResponse.json({ domain: d, instructions: dnsInstructions });
    }

    const { data: inserted, error } = await supabase
      .from("organization_domains")
      .insert({
        organization_id: organizationId,
        domain,
        status: "pending",
        dns_provider: null,
      })
      .select("id, domain, status, created_at")
      .single();

    if (error) {
      console.error("organization-website domains POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ domain: inserted, instructions: dnsInstructions });
  } catch (e) {
    console.error("organization-website domains POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}

/** DELETE: Remove a custom domain */
export async function DELETE(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const domainId = req.nextUrl.searchParams.get("domainId");
    const organizationId = req.nextUrl.searchParams.get("organizationId");

    if (!domainId || !organizationId) {
      return NextResponse.json({ error: "domainId and organizationId required" }, { status: 400 });
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

    const { error } = await supabase
      .from("organization_domains")
      .delete()
      .eq("id", domainId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("organization-website domains DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("organization-website domains DELETE error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
