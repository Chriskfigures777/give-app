import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { getOrgVerification } from "@/lib/verification";
import { WebsiteBuilderClient } from "./website-builder-client";
import { VerificationGate } from "@/components/verification-gate";
import { fetchFormsPageData } from "../forms/forms-data";
import { getOrgPlan, getEffectiveSplitRecipientLimit } from "@/lib/plan";
import { getBaseUrlForDashboard } from "@/lib/request-origin";

export default async function WebsiteBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ openForm?: string; project?: string }>;
}) {
  const { profile, supabase } = await requireAuth();
  const isPlatformAdmin = profile?.role === "platform_admin";
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) {
    redirect("/dashboard");
  }

  if (!isPlatformAdmin) {
    const { verificationStatus } = await getOrgVerification(orgId, supabase);

    if (verificationStatus !== "verified") {
      return (
        <VerificationGate
          verificationStatus={verificationStatus}
          featureName="Website Builder"
          featureDescription="Build and publish a beautiful website for your organization. You need a verified Stripe Connect account so your donation buttons work on the published site."
        />
      );
    }
  }

  const data = await fetchFormsPageData(orgId, supabase);
  const { plan, planStatus } = await getOrgPlan(orgId, supabase);
  const splitRecipientLimit = getEffectiveSplitRecipientLimit(plan, planStatus);
  const baseUrl = await getBaseUrlForDashboard();

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

  const resolved = await searchParams;
  const openFormInitially = resolved.openForm === "1" || resolved.openForm === "true";
  const initialProjectId = resolved.project && resolved.project.trim() ? resolved.project.trim() : null;

  return (
    <div className="h-full w-full">
      <Suspense fallback={<div className="flex h-full w-full items-center justify-center text-slate-500">Loading website builder…</div>}>
        <WebsiteBuilderClient
          organizationId={orgId}
          websiteFormName={websiteFormName}
          formsData={data}
          baseUrl={baseUrl}
          splitRecipientLimit={splitRecipientLimit}
          plan={plan}
          openFormInitially={openFormInitially}
          initialProjectId={initialProjectId}
        />
      </Suspense>
    </div>
  );
}
