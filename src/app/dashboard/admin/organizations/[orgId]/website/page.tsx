import { requirePlatformAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, ExternalLink } from "lucide-react";
import { WebsiteBuilderClient } from "@/app/dashboard/pages/website-builder-client";
import { fetchFormsPageData } from "@/app/dashboard/forms/forms-data";
import { getOrgPlan, getEffectiveSplitRecipientLimit } from "@/lib/plan";
import { getBaseUrlForDashboard } from "@/lib/request-origin";
import { DomainWizard } from "@/app/dashboard/settings/domain-wizard";

export default async function AdminOrgWebsitePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requirePlatformAdmin();

  // Use service client so we can read any org's data regardless of RLS
  const supabase = createServiceClient();

  // @ts-ignore – plan columns not in generated types
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, website_url, published_website_project_id, plan, plan_status")
    .eq("id", orgId)
    .single();

  if (!org) notFound();

  const o = org as unknown as Record<string, unknown>;

  const [formsData, planInfo, baseUrl] = await Promise.all([
    fetchFormsPageData(orgId, supabase),
    getOrgPlan(orgId, supabase),
    getBaseUrlForDashboard(),
  ]);

  const { plan, planStatus } = planInfo;
  const splitRecipientLimit = getEffectiveSplitRecipientLimit(plan, planStatus);

  // Resolve website form name
  const { data: formCustom } = await supabase
    .from("form_customizations")
    .select("website_embed_card_id")
    .eq("organization_id", orgId)
    .maybeSingle();
  const websiteEmbedCardId = (formCustom as { website_embed_card_id?: string | null } | null)?.website_embed_card_id ?? null;

  let websiteFormName = "Main form";
  if (websiteEmbedCardId) {
    const { data: card } = await supabase
      .from("org_embed_cards")
      .select("name")
      .eq("id", websiteEmbedCardId)
      .eq("organization_id", orgId)
      .maybeSingle();
    websiteFormName = (card as { name?: string } | null)?.name ?? "Payment form";
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/dashboard/admin/organizations/${orgId}`}
          className="inline-flex items-center gap-2 text-sm text-dashboard-text-muted hover:text-dashboard-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {o.name as string}
        </Link>
        {Boolean(o.website_url) && (
          <a
            href={o.website_url as string}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashboard-border bg-dashboard-card px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
          >
            <Globe className="h-4 w-4" /> View live site
            <ExternalLink className="h-3 w-3 text-dashboard-text-muted" />
          </a>
        )}
      </div>

      {/* DNS / Domain management */}
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
        <h3 className="text-base font-semibold text-dashboard-text">Domain &amp; DNS</h3>
        <p className="mt-1 text-sm text-dashboard-text-muted mb-5">
          Custom domains, DNS records, and hosting configuration for{" "}
          <span className="font-medium text-dashboard-text">{o.name as string}</span>.
        </p>
        <DomainWizard organizationId={orgId} isPlatformAdmin={true} />
      </section>

      {/* Website builder */}
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-dashboard-border">
          <h3 className="text-base font-semibold text-dashboard-text">Website Builder</h3>
          <p className="text-sm text-dashboard-text-muted">
            Build and publish pages for{" "}
            <span className="font-medium text-dashboard-text">{o.name as string}</span>.
          </p>
        </div>
        <div className="h-[750px]">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-dashboard-text-muted">
                Loading website builder…
              </div>
            }
          >
            <WebsiteBuilderClient
              organizationId={orgId}
              websiteFormName={websiteFormName}
              formsData={formsData}
              baseUrl={baseUrl}
              splitRecipientLimit={splitRecipientLimit}
              plan={plan}
              openFormInitially={false}
              initialProjectId={null}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
