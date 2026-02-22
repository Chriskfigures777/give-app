import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { env } from "@/env";
import { FORM_TEMPLATE_PRESET } from "@/lib/form-template-preset";
import { EmbedFormClient } from "../embed/embed-form-client";
import { EmbedCardsPanel } from "../embed/embed-cards-panel";
import { CampaignsEditor } from "./campaigns-editor";
import { DonateButtonFormSelector } from "./donate-button-form-selector";
import { CustomizationLayout } from "./customization-layout";
import { Code2, Target, DollarSign, Globe } from "lucide-react";
import { SplitSettingsPanel } from "./split-settings-panel";
import { SPLITS_ENABLED } from "@/lib/feature-flags";
import { getOrgPlan, hasAccessToPlan, getEffectiveSplitRecipientLimit } from "@/lib/plan";
import Link from "next/link";

const DEFAULT_AMOUNTS = [10, 12, 25, 50, 100, 250, 500, 1000];

type Campaign = { id: string; name: string; suggested_amounts: unknown; minimum_amount_cents: number | null; allow_recurring: boolean | null; allow_anonymous: boolean | null; goal_amount_cents?: number | null; current_amount_cents?: number | null; goal_deadline?: string | null };
type DesignSet = { media_type: "image" | "video"; media_url: string | null; title: string | null; subtitle: string | null };
type FormCustom = {
  suggested_amounts?: number[] | null;
  allow_custom_amount?: boolean | null;
  show_endowment_selection?: boolean | null;
  header_text?: string | null;
  subheader_text?: string | null;
  thank_you_message?: string | null;
  thank_you_video_url?: string | null;
  thank_you_cta_url?: string | null;
  thank_you_cta_text?: string | null;
  primary_color?: string | null;
  button_color?: string | null;
  button_text_color?: string | null;
  button_border_radius?: string | null;
  header_image_url?: string | null;
  font_family?: string | null;
  design_sets?: DesignSet[] | null;
  form_display_mode?: "full" | "compressed" | "full_width" | null;
  form_media_side?: "left" | "right" | null;
  embed_form_theme?: "default" | "grace" | "dark-elegant" | "bold-contemporary" | null;
  org_page_embed_card_id?: string | null;
  website_embed_card_id?: string | null;
  org_page_donate_link_slug?: string | null;
  splits?: { percentage: number; accountId: string }[] | null;
};

export default async function CustomizationPage() {
  const { profile, supabase } = await requireAuth();
  const isPlatformAdmin = profile?.role === "platform_admin";
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!isPlatformAdmin && !orgId) redirect("/dashboard");

  const orgQuery = supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgId!)
    .single();

  const formQuery = supabase
    .from("form_customizations")
    .select("*, splits")
    .eq("organization_id", orgId!)
    .single();

  const { data: connAsA } = await supabase
    .from("peer_connections")
    .select("side_b_id, side_b_type")
    .eq("side_a_id", orgId!)
    .eq("side_a_type", "organization");
  const { data: connAsB } = await supabase
    .from("peer_connections")
    .select("side_a_id, side_a_type")
    .eq("side_b_id", orgId!)
    .eq("side_b_type", "organization");
  const peerOrgIds = new Set<string>();
  for (const c of (connAsA ?? []) as { side_b_id: string; side_b_type: string }[]) {
    if (c.side_b_type === "organization") peerOrgIds.add(c.side_b_id);
  }
  for (const c of (connAsB ?? []) as { side_a_id: string; side_a_type: string }[]) {
    if (c.side_a_type === "organization") peerOrgIds.add(c.side_a_id);
  }
  const { data: peerOrgs } = peerOrgIds.size > 0
    ? await supabase
        .from("organizations")
        .select("id, name, slug, stripe_connect_account_id")
        .in("id", Array.from(peerOrgIds))
        .not("stripe_connect_account_id", "is", null)
        .order("name")
    : { data: [] };

  const campaignsQuery = supabase
    .from("donation_campaigns")
    .select("id, name, suggested_amounts, minimum_amount_cents, allow_recurring, allow_anonymous, goal_amount_cents, current_amount_cents, goal_deadline")
    .eq("organization_id", orgId!)
    .eq("is_active", true);

  const endowmentQuery = supabase
    .from("endowment_funds")
    .select("id, name")
    .limit(20);

  const donationLinksQuery = supabase
    .from("donation_links")
    .select("id, name, slug")
    .eq("organization_id", orgId!);

  const [{ data: orgRow }, { data: formCustomRow }, { data: campaignsData }, { data: endowmentFunds }, { data: donationLinks }] = await Promise.all([
    orgQuery,
    formQuery,
    campaignsQuery,
    endowmentQuery,
    donationLinksQuery,
  ]);

  if (!orgRow) redirect("/dashboard");
  const org = orgRow as { id: string; name: string; slug: string };
  const formCustom = formCustomRow as FormCustom | null;

  const { plan, planStatus } = await getOrgPlan(orgId!, supabase);
  const hasWebsitePlan = hasAccessToPlan(plan, planStatus, "growth");
  const splitRecipientLimit = getEffectiveSplitRecipientLimit(plan, planStatus);
  const campaigns = (campaignsData ?? []) as Campaign[];
  const minCents = campaigns[0]?.minimum_amount_cents ?? 100;

  const template = FORM_TEMPLATE_PRESET;
  const effectiveForm = formCustom ?? ({
    ...template,
    subheader_text: `Support ${org.name}`,
    design_sets: template.design_sets?.map((s) => ({
      ...s,
      subtitle: `Support ${org.name}`,
    })),
  } as FormCustom);
  const suggestedAmounts = (effectiveForm.suggested_amounts as number[] | null) ?? DEFAULT_AMOUNTS;
  const baseUrl = env.app.domain().replace(/\/$/, "");

  return (
    <CustomizationLayout
      designerPanel={
        <EmbedFormClient
          organizationId={org.id}
          organizationName={org.name}
          slug={org.slug}
          baseUrl={baseUrl}
          campaigns={campaigns}
          websiteEmbedCardId={effectiveForm.website_embed_card_id ?? null}
          endowmentFunds={endowmentFunds ?? []}
          suggestedAmounts={suggestedAmounts}
          minimumAmountCents={minCents}
          showEndowmentSelection={effectiveForm.show_endowment_selection ?? false}
          allowCustomAmount={effectiveForm.allow_custom_amount ?? true}
          initialHeaderText={effectiveForm.header_text ?? "Make a Donation"}
          initialSubheaderText={effectiveForm.subheader_text ?? `Support ${org.name}`}
          initialThankYouMessage={effectiveForm.thank_you_message ?? null}
          initialThankYouVideoUrl={effectiveForm.thank_you_video_url ?? null}
          initialThankYouCtaUrl={effectiveForm.thank_you_cta_url ?? null}
          initialThankYouCtaText={effectiveForm.thank_you_cta_text ?? null}
          initialButtonColor={effectiveForm.button_color ?? null}
          initialButtonTextColor={effectiveForm.button_text_color ?? null}
          headerImageUrl={effectiveForm.header_image_url ?? null}
          primaryColor={effectiveForm.primary_color ?? null}
          initialBorderRadius={effectiveForm.button_border_radius ?? null}
          initialFontFamily={effectiveForm.font_family ?? null}
          initialDesignSets={(effectiveForm.design_sets as DesignSet[] | undefined) ?? null}
          initialFormDisplayMode={(effectiveForm.form_display_mode as "full" | "compressed" | "full_width") ?? "compressed"}
          initialFormMediaSide={(effectiveForm.form_media_side as "left" | "right") ?? "left"}
          initialEmbedFormTheme={(effectiveForm.embed_form_theme as "default" | "grace" | "dark-elegant" | "bold-contemporary") ?? "default"}
          initialSplits={(effectiveForm.splits as { percentage: number; accountId: string }[] | undefined) ?? []}
          connectedPeers={(peerOrgs ?? []) as { id: string; name: string; slug: string; stripe_connect_account_id: string }[]}
          splitRecipientLimit={splitRecipientLimit}
          currentPlan={plan}
        />
      }
      cardsPanel={
        <EmbedCardsPanel
          organizationId={org.id}
          organizationName={org.name}
          slug={org.slug}
          baseUrl={baseUrl}
          campaigns={campaigns}
          orgPageEmbedCardId={effectiveForm.org_page_embed_card_id ?? null}
          websiteEmbedCardId={effectiveForm.website_embed_card_id ?? null}
          hasDefaultForm={!!formCustom}
          defaultFormDisplayMode={(effectiveForm.form_display_mode as "full" | "compressed" | "full_width") ?? "full"}
          defaultFormDesignSet={
            (effectiveForm.design_sets as DesignSet[] | undefined)?.[0] ??
            (effectiveForm.header_image_url || effectiveForm.header_text || effectiveForm.subheader_text
              ? {
                  media_type: "image" as const,
                  media_url: effectiveForm.header_image_url ?? null,
                  title: effectiveForm.header_text ?? null,
                  subtitle: effectiveForm.subheader_text ?? null,
                }
              : null)
          }
          defaultFormButtonColor={effectiveForm.button_color ?? null}
          defaultFormButtonTextColor={effectiveForm.button_text_color ?? null}
          defaultFormBorderRadius={effectiveForm.button_border_radius ?? null}
          defaultEmbedFormTheme={(effectiveForm.embed_form_theme as "default" | "grace" | "dark-elegant" | "bold-contemporary") ?? "default"}
          connectedPeers={(peerOrgs ?? []) as { id: string; name: string; slug: string; stripe_connect_account_id: string }[]}
        />
      }
      settingsPanel={
        <>
          {/* Website form */}
          <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="flex items-center gap-4 px-7 py-5 border-b border-slate-100 dark:border-slate-700/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Website form</h2>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Which donation form appears on your website builder pages</p>
              </div>
            </div>
            <div className="p-7">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Go to the <strong>Embed Cards</strong> tab and click the <strong>Website</strong> button on the form you want to use. The form design matches your website theme. Splits and content are edited in Form Designer or per-card in Embed Cards.
              </p>
            </div>
          </section>

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
                organizationId={org.id}
                orgSlug={org.slug}
                donationLinks={(donationLinks ?? []) as { id: string; name: string; slug: string }[]}
                currentDonateLinkSlug={effectiveForm.org_page_donate_link_slug ?? null}
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
              <CampaignsEditor campaigns={campaigns} />
            </div>
          </section>

          {/* Payment splits */}
          {SPLITS_ENABLED && (
            <SplitSettingsPanel
              organizationId={org.id}
              organizationName={org.name}
              initialSplits={(effectiveForm.splits as { percentage: number; accountId: string }[] | undefined) ?? []}
              connectedPeers={(peerOrgs ?? []) as { id: string; name: string; slug: string; stripe_connect_account_id: string }[]}
              splitRecipientLimit={splitRecipientLimit}
              currentPlan={plan}
            />
          )}

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
                Copy embed codes from the <strong className="text-slate-500 dark:text-slate-400">Form Designer</strong> or <strong className="text-slate-500 dark:text-slate-400">Embed Cards</strong> tabs above.
              </p>
            </div>
          </section>
        </>
      }
    />
  );
}
