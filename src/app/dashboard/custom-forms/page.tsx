import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { env } from "@/env";
import { EmbedCardsPanel } from "../embed/embed-cards-panel";
import { fetchFormsPageData } from "../forms/forms-data";
import { getOrgPlan, getEffectiveSplitRecipientLimit } from "@/lib/plan";
import type { DesignSet } from "@/lib/stock-media";
import { Code2 } from "lucide-react";

export default async function CustomFormsPage() {
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
          Custom forms
        </h1>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          Create as many forms as you need. Each form has its own design, embed code, and payment splits. Share different forms with different partners.
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
          hasDefaultForm={!!data.formCustom}
          defaultFormDisplayMode={(data.effectiveForm.form_display_mode as "full" | "compressed" | "full_width") ?? "full"}
          defaultFormDesignSet={(() => {
            const ds = (data.effectiveForm.design_sets as DesignSet[] | undefined)?.[0];
            if (ds?.media_url || ds?.title || ds?.subtitle) return ds;
            if (data.effectiveForm.header_image_url || data.effectiveForm.header_text || data.effectiveForm.subheader_text) {
              return {
                media_type: "image" as const,
                media_url: data.effectiveForm.header_image_url ?? null,
                title: data.effectiveForm.header_text ?? null,
                subtitle: data.effectiveForm.subheader_text ?? null,
              } satisfies DesignSet;
            }
            return null;
          })()}
          defaultFormButtonColor={data.effectiveForm.button_color ?? null}
          defaultFormButtonTextColor={data.effectiveForm.button_text_color ?? null}
          defaultFormBorderRadius={data.effectiveForm.button_border_radius ?? null}
          defaultEmbedFormTheme={(data.effectiveForm.embed_form_theme as "default" | "grace" | "dark-elegant" | "bold-contemporary") ?? "default"}
          connectedPeers={data.peerOrgs}
          splitRecipientLimit={splitRecipientLimit}
          currentPlan={plan}
        />

        {/* Embed instructions */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 px-7 py-5 border-b border-slate-100 dark:border-slate-700/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
              <Code2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Embed on Webflow & WordPress</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Add your donation form to external sites</p>
            </div>
          </div>
          <div className="p-7">
            <ul className="space-y-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">1</span>
                <div>
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">Webflow:</strong>{" "}
                  Add an Embed element, paste the iframe code into the Embed code field, then resize the block (e.g. 100% width, 600px height).
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">2</span>
                <div>
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">WordPress:</strong>{" "}
                  Add a Custom HTML block and paste the iframe code, or use a plugin like &quot;Insert HTML Snippet&quot; or &quot;Embed Code&quot;.
                </div>
              </li>
            </ul>
            <p className="mt-5 text-xs text-slate-400 dark:text-slate-500">
              Copy embed codes from the forms above.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
