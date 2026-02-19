import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { generateStaticSite } from "@/lib/site-generator";
import {
  uploadSiteToS3,
  deleteSiteFromS3,
  invalidateCloudFrontCache,
  updateDomainMap,
  isHostingConfigured,
} from "@/lib/aws-hosting";
import { getVerificationStatus } from "@/lib/verification";

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

/** POST: Publish or unpublish a website builder project */
export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const body = await req.json();
    const { organizationId, projectId, unpublish } = body;

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

    // Fetch org slug + Stripe Connect account for S3 paths and verification
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("slug, stripe_connect_account_id, onboarding_completed")
      .eq("id", organizationId)
      .single();
    const org = orgRow as { slug?: string; stripe_connect_account_id?: string | null; onboarding_completed?: boolean | null } | null;
    const orgSlug = org?.slug;

    // Verify Stripe Connect is set up before allowing publish (not needed for unpublish)
    if (!unpublish && profile?.role !== "platform_admin") {
      const isOnboarded = org?.onboarding_completed === true;
      if (!isOnboarded) {
        const status = await getVerificationStatus(org?.stripe_connect_account_id ?? null);
        if (status !== "verified") {
          return NextResponse.json(
            {
              error: "Your Stripe Connect account must be verified before you can publish a public page. Please complete account setup in Settings.",
              code: "VERIFICATION_REQUIRED",
            },
            { status: 403 }
          );
        }
      }
    }

    if (unpublish) {
      const { error } = await supabase
        .from("organizations")
        .update({ published_website_project_id: null })
        .eq("id", organizationId);

      if (error) {
        console.error("organization-website unpublish error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Remove from S3 (non-blocking)
      if (isHostingConfigured() && orgSlug) {
        deleteSiteFromS3(orgSlug).catch((e) => console.error("S3 delete error:", e));
        invalidateCloudFrontCache(orgSlug).catch((e) => console.error("CF invalidation error:", e));
      }

      return NextResponse.json({ ok: true, published: false });
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId required when publishing" }, { status: 400 });
    }

    const { data: project } = await supabase
      .from("website_builder_projects")
      .select("id, organization_id, project")
      .eq("id", projectId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("organizations")
      .update({ published_website_project_id: projectId })
      .eq("id", organizationId);

    if (error) {
      console.error("organization-website publish error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if this org has a verified custom domain
    const { data: verifiedDomains } = await supabase
      .from("organization_domains")
      .select("domain")
      .eq("organization_id", organizationId)
      .eq("status", "verified");

    const hasCustomDomain = !!(verifiedDomains && verifiedDomains.length > 0);

    // Only deploy to S3/CloudFront if the org has a verified custom domain.
    // Without a domain, the site is accessible via the preview URL (/site/{slug}).
    if (hasCustomDomain && isHostingConfigured() && orgSlug) {
      (async () => {
        try {
          const projectJson = (project as { project: unknown }).project as {
            pages?: Array<{ id?: string; name: string; component?: string }>;
            default?: { pages?: Array<{ id?: string; name: string; component?: string }> };
            previewHtml?: string;
          };

          const pages = await generateStaticSite(projectJson, organizationId, orgSlug);
          const s3Pages = pages.map((p) => ({ slug: p.slug, html: p.html }));
          await uploadSiteToS3(orgSlug, s3Pages);
          await invalidateCloudFrontCache(orgSlug);

          // Rebuild domain map for all verified domains across all published orgs
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
                const domain = (m as { domain: string }).domain;
                domainMap[domain] = slug as string;
                if (!domain.startsWith("www.")) {
                  domainMap[`www.${domain}`] = slug as string;
                }
              }
            }
            await updateDomainMap(domainMap);
          }

          console.log(`Published ${pages.length} pages to S3 for ${orgSlug}`);
        } catch (e) {
          console.error("S3 publish error:", e);
        }
      })();
    }

    return NextResponse.json({
      ok: true,
      published: true,
      projectId,
      publishMode: hasCustomDomain ? "domain" : "preview",
    });
  } catch (e) {
    console.error("organization-website publish error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
