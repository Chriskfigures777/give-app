import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getBaseUrlForDashboard } from "@/lib/request-origin";
import { EmbedCardsPanel } from "../embed/embed-cards-panel";
import { fetchFormsPageData } from "../forms/forms-data";
import { getOrgPlan, getEffectiveSplitRecipientLimit } from "@/lib/plan";
import { getOrgVerification } from "@/lib/verification";
import { VerificationGate } from "@/components/verification-gate";
import { Code2 } from "lucide-react";

export default async function CustomFormsPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  const isPlatformAdmin = profile?.role === "platform_admin";

  if (!orgId) redirect("/dashboard");

  if (!isPlatformAdmin) {
    const { verificationStatus } = await getOrgVerification(orgId, supabase);
    if (verificationStatus !== "verified") {
      return (
        <VerificationGate
          verificationStatus={verificationStatus}
          featureName="Payment Forms"
          featureDescription="Create payment forms with your branding, splits, and design. You need a verified Stripe Connect account so payments can be processed."
        />
      );
    }
  }

  const data = await fetchFormsPageData(orgId, supabase);
  if (!data) redirect("/dashboard");

  const { plan, planStatus } = await getOrgPlan(orgId, supabase);
  const splitRecipientLimit = getEffectiveSplitRecipientLimit(plan, planStatus);
  const baseUrl = await getBaseUrlForDashboard();

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
          Payment forms
        </h1>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          Create as many payment forms as you need. Each form has its own design, embed code, and payment splits. Share different forms with different partners.
        </p>
      </div>

      <div className="space-y-8">
        <EmbedCardsPanel
          organizationId={data.org.id}
          organizationName={data.org.name}
          slug={data.org.slug}
          baseUrl={baseUrl}
          campaigns={data.campaigns}
          orgPageEmbedCardId={data.effectiveForm.org_page_embed_card_id ?? null}
          websiteEmbedCardId={null}
          hideWebsiteButton
          hasDefaultForm={false}
          connectedPeers={data.peerOrgs}
          splitRecipientLimit={splitRecipientLimit}
          currentPlan={plan}
        />

        {/* Embed instructions */}
        <section className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 px-6 py-4 border-b border-dashboard-border">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dashboard-card-hover">
              <Code2 className="h-5 w-5 text-dashboard-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-dashboard-text">Embed on Webflow & WordPress</h2>
              <p className="text-sm text-dashboard-text-muted mt-0.5">Add your donation form to external sites</p>
            </div>
          </div>
          <div className="p-6">
            <ul className="space-y-4 text-sm text-dashboard-text-muted leading-relaxed">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dashboard-card-hover text-xs font-bold text-dashboard-accent">1</span>
                <div>
                  <strong className="text-dashboard-text font-semibold">Webflow:</strong>{" "}
                  Add an Embed element, paste the iframe code into the Embed code field, then resize the block (e.g. 100% width, 600px height).
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dashboard-card-hover text-xs font-bold text-dashboard-accent">2</span>
                <div>
                  <strong className="text-dashboard-text font-semibold">WordPress:</strong>{" "}
                  Add a Custom HTML block and paste the iframe code, or use a plugin like &quot;Insert HTML Snippet&quot; or &quot;Embed Code&quot;.
                </div>
              </li>
            </ul>
            <p className="mt-4 text-xs text-dashboard-text-muted">
              Copy embed codes from the payment forms above.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
