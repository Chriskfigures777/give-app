/**
 * Auto-republish a site to S3 when CMS content changes.
 *
 * Call this after saving CMS data (events, sermons, etc.) to keep
 * the static HTML on S3 in sync with the latest content.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { generateStaticSite } from "@/lib/site-generator";
import {
  uploadSiteToS3,
  invalidateCloudFrontCache,
  isHostingConfigured,
} from "@/lib/aws-hosting";

/**
 * Republish the static site for an org to S3.
 * No-op if AWS hosting is not configured or the org has no published site.
 * Runs async (fire-and-forget) — does not throw.
 */
export function triggerRepublish(organizationId: string): void {
  if (!isHostingConfigured()) return;

  (async () => {
    try {
      const supabase = createServiceClient();

      const { data: org } = await supabase
        .from("organizations")
        .select("slug, published_website_project_id")
        .eq("id", organizationId)
        .single();

      if (!org) return;
      const slug = (org as { slug?: string }).slug;
      const projectId = (org as { published_website_project_id?: string | null }).published_website_project_id;
      if (!slug || !projectId) return;

      const { data: projectRow } = await supabase
        .from("website_builder_projects")
        .select("project")
        .eq("id", projectId)
        .single();

      if (!projectRow) return;

      const projectJson = (projectRow as { project: unknown }).project as {
        pages?: Array<{ id?: string; name: string; component?: string }>;
        default?: { pages?: Array<{ id?: string; name: string; component?: string }> };
        previewHtml?: string;
      };

      const pages = await generateStaticSite(projectJson, organizationId, slug);
      const s3Pages = pages.map((p) => ({ slug: p.slug, html: p.html }));

      await uploadSiteToS3(slug, s3Pages);
      await invalidateCloudFrontCache(slug);

      console.log(`Auto-republished ${pages.length} pages to S3 for ${slug}`);
    } catch (e) {
      console.error("Auto-republish error:", e);
    }
  })();
}
