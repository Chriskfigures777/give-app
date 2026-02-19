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

/** GET: Org slug and published status for website builder */
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

    const { data: org } = await supabase
      .from("organizations")
      .select("slug, published_website_project_id")
      .eq("id", organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Use request origin so preview URLs work on the current host
    const origin = req.nextUrl.origin || "";
    const base =
      origin.startsWith("http")
        ? origin
        : process.env.NEXT_PUBLIC_APP_URL ||
          process.env.DOMAIN ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const baseTrimmed = base.replace(/\/$/, "");
    const slug = (org as { slug: string }).slug;

    // Preview URL always goes through Vercel /site/ route (works before CloudFront is set up)
    const previewUrl = slug ? `${baseTrimmed}/site/${slug}` : null;

    // Published site URL: prefer custom domain, then Vercel /site/ preview
    // NOTE: We do NOT use the bare CloudFront domain as publishedUrl.
    // Lambda@Edge routes by Host header matched against the domain map (custom domains only).
    // The bare CloudFront domain (e.g. d6u7sflc0yaio.cloudfront.net) is never in the
    // domain map, so requests to it return 404. Only use it once a custom domain is verified.
    let publishedUrl = previewUrl;
    if (slug) {
      // Check for a verified custom domain
      const { data: customDomain } = await supabase
        .from("organization_domains")
        .select("domain")
        .eq("organization_id", organizationId)
        .eq("status", "verified")
        .limit(1)
        .maybeSingle();

      if (customDomain) {
        const d = (customDomain as { domain: string }).domain;
        publishedUrl = `https://${d}`;
      }
      // If no verified custom domain, keep previewUrl (always works via /site/slug)
    }

    return NextResponse.json({
      slug,
      publishedProjectId: (org as { published_website_project_id?: string | null })
        .published_website_project_id,
      siteUrl: previewUrl,
      publishedUrl,
    });
  } catch (e) {
    console.error("organization-website status error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
