import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { env } from "@/env";
import { ThemeFormEditor } from "../customization/theme-form-editor";
import { CampaignsEditor } from "../customization/campaigns-editor";
import { DonateButtonFormSelector } from "../customization/donate-button-form-selector";
import { fetchFormsPageData } from "../forms/forms-data";
import { getOrgPlan, getEffectiveSplitRecipientLimit } from "@/lib/plan";
import { Code2, Target, DollarSign } from "lucide-react";

export default async function WebsiteFormPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) redirect("/dashboard");

  const data = await fetchFormsPageData(orgId, supabase);
  if (!data) redirect("/dashboard");

  const { plan, planStatus } = await getOrgPlan(orgId, supabase);
  const splitRecipientLimit = getEffectiveSplitRecipientLimit(plan, planStatus);
  const baseUrl = env.app.domain().replace(/\/$/, "");

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
          Website form
        </h1>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          One form for your website templates. Edit the basics — name, image or video, amounts, splits. It loads dynamically on your site and matches your theme automatically.
        </p>
      </div>

      <div className="space-y-8">
        <ThemeFormEditor
          organizationId={data.org.id}
          organizationName={data.org.name}
          slug={data.org.slug}
          baseUrl={baseUrl}
          campaigns={data.campaigns}
          endowmentFunds={data.endowmentFunds}
          suggestedAmounts={data.suggestedAmounts}
          minimumAmountCents={data.minCents}
          showEndowmentSelection={data.effectiveForm.show_endowment_selection ?? false}
          allowCustomAmount={data.effectiveForm.allow_custom_amount ?? true}
          initialHeaderText={data.effectiveForm.header_text ?? "Make a Donation"}
          initialSubheaderText={data.effectiveForm.subheader_text ?? `Support ${data.org.name}`}
          initialThankYouMessage={data.effectiveForm.thank_you_message ?? null}
          initialThankYouVideoUrl={data.effectiveForm.thank_you_video_url ?? null}
          initialThankYouCtaUrl={data.effectiveForm.thank_you_cta_url ?? null}
          initialThankYouCtaText={data.effectiveForm.thank_you_cta_text ?? null}
          headerImageUrl={data.effectiveForm.header_image_url ?? null}
          initialDesignSet={data.designSet}
          initialSplits={(data.effectiveForm.splits as { percentage: number; accountId: string }[] | undefined) ?? []}
          connectedPeers={data.peerOrgs}
          splitRecipientLimit={splitRecipientLimit}
          currentPlan={plan}
        />

        {/* Donate button */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 px-7 py-5 border-b border-slate-100 dark:border-slate-700/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Donate Button</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Configure which form opens from your org page</p>
            </div>
          </div>
          <div className="p-7">
            <DonateButtonFormSelector
              organizationId={data.org.id}
              orgSlug={data.org.slug}
              donationLinks={data.donationLinks}
              currentDonateLinkSlug={data.effectiveForm.org_page_donate_link_slug ?? null}
            />
          </div>
        </section>

        {/* Campaign goals */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 px-7 py-5 border-b border-slate-100 dark:border-slate-700/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
              <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Campaign Goals</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Set amounts and deadlines for donation campaigns</p>
            </div>
          </div>
          <div className="p-7">
            <CampaignsEditor campaigns={data.campaigns} />
          </div>
        </section>
      </div>
    </div>
  );
}
