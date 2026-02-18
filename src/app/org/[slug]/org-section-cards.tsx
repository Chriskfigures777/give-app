"use client";

import { motion } from "motion/react";
import { DonationForm } from "@/app/give/[slug]/donation-form";
import { GiveSignInPrompt } from "@/app/give/[slug]/give-sign-in-prompt";
import { CompressedDonationCard } from "@/components/compressed-donation-card";
import { GoalDonationCard } from "@/components/goal-donation-card";
import { GoalCompactDonationCard } from "@/components/goal-compact-donation-card";
import { MinimalDonationCard } from "@/components/minimal-donation-card";
import { FormCardMedia } from "@/components/form-card-media";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";
import { getGoogleFontUrl, getFontFamily, getHeaderFontWeight } from "@/lib/form-fonts";
import type { DesignSet } from "@/lib/stock-media";

type EmbedCard = {
  id: string;
  name: string;
  style: "full" | "compressed" | "goal" | "goal_compact" | "minimal";
  campaign_id: string | null;
  design_set: { media_type?: string; media_url?: string | null; title?: string | null; subtitle?: string | null } | null;
  button_color: string | null;
  button_text_color: string | null;
  primary_color: string | null;
  goal_description?: string | null;
};

type Campaign = {
  id: string;
  name: string;
  suggested_amounts: unknown;
  minimum_amount_cents: number | null;
  allow_recurring: boolean | null;
  allow_anonymous?: boolean | null;
  goal_amount_cents?: number | null;
  current_amount_cents?: number | null;
  goal_deadline?: string | null;
};

type EndowmentFund = { id: string; name: string };

type Props = {
  section: "hero" | "about" | "team" | "story";
  organizationId: string;
  organizationName: string;
  slug: string;
  cards: EmbedCard[];
  campaigns: Campaign[];
  endowmentFunds: EndowmentFund[];
  suggestedAmounts: number[];
  minimumAmountCents: number;
  showEndowmentSelection: boolean;
  allowCustomAmount: boolean;
  allowAnonymous: boolean;
  formButtonColor?: string | null;
  formButtonTextColor?: string | null;
  formBorderRadius?: string | null;
  formHeaderImageUrl?: string | null;
  formHeaderText?: string | null;
  formSubheaderText?: string | null;
  formDesignSets?: DesignSet[] | null;
  formFontFamily?: string | null;
  initialFrequency?: "monthly" | "yearly";
};

const SECTION_LABELS: Record<string, string> = {
  hero: "Support us",
  about: "Make a gift",
  team: "Donate",
  story: "Give now",
};

export function OrgSectionCards(props: Props) {
  const {
    section,
    organizationId,
    organizationName,
    slug,
    cards,
    campaigns,
    endowmentFunds,
    suggestedAmounts,
    minimumAmountCents,
    showEndowmentSelection,
    allowCustomAmount,
    allowAnonymous,
    formButtonColor,
    formButtonTextColor,
    formBorderRadius,
    formHeaderImageUrl,
    formHeaderText,
    formSubheaderText,
    formDesignSets,
    formFontFamily,
    initialFrequency,
  } = props;

  if (cards.length === 0) return null;

  const fontFamilyResolved = getFontFamily(formFontFamily ?? undefined);
  const headerFontWeight = getHeaderFontWeight(formFontFamily ?? undefined);
  const googleFontUrl = getGoogleFontUrl(formFontFamily ?? undefined);
  const basePath = "";

  return (
    <section className="relative bg-slate-50 py-16 md:py-20">
      {googleFontUrl && (
        <link rel="stylesheet" href={googleFontUrl} />
      )}
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-xl text-center mb-10"
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {SECTION_LABELS[section] ?? "Support us"}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {cards.map((card) => {
            const designSet = card.design_set
              ? {
                  media_type: (card.design_set.media_type ?? "image") as "image" | "video",
                  media_url: card.design_set.media_url ?? null,
                  title: card.design_set.title ?? null,
                  subtitle: card.design_set.subtitle ?? null,
                }
              : null;
            const designSets = designSet ? [designSet] : (formDesignSets ?? []);

            if (card.style === "goal" || card.style === "goal_compact") {
              const campaign = card.campaign_id ? campaigns.find((c) => c.id === card.campaign_id) : null;
              if (!campaign || campaign.goal_amount_cents == null || campaign.goal_amount_cents <= 0) return null;
              const goalAmountCents = Number(campaign.goal_amount_cents);
              const currentAmountCents = Number(campaign.current_amount_cents ?? 0);

              if (card.style === "goal") {
                return (
                  <GoalDonationCard
                    key={card.id}
                    organizationName={organizationName}
                    slug={slug}
                    designSet={designSet ?? undefined}
                    headerImageUrl={formHeaderImageUrl}
                    title={designSet?.title ?? formHeaderText}
                    subtitle={designSet?.subtitle ?? formSubheaderText}
                    goalDescription={card.goal_description}
                    buttonColor={card.button_color ?? formButtonColor}
                    buttonTextColor={card.button_text_color ?? formButtonTextColor}
                    primaryColor={card.primary_color}
                    borderRadius={formBorderRadius ?? undefined}
                    goalAmountCents={goalAmountCents}
                    currentAmountCents={currentAmountCents}
                    goalDeadline={campaign.goal_deadline}
                    campaignId={card.campaign_id}
                    basePath={basePath}
                  />
                );
              }
              return (
                <GoalCompactDonationCard
                  key={card.id}
                  organizationName={organizationName}
                  slug={slug}
                  title={designSet?.title ?? formHeaderText ?? campaign.name}
                  goalDescription={card.goal_description}
                  buttonColor={card.button_color ?? formButtonColor}
                  buttonTextColor={card.button_text_color ?? formButtonTextColor}
                  primaryColor={card.primary_color}
                  borderRadius={formBorderRadius ?? undefined}
                  goalAmountCents={goalAmountCents}
                  currentAmountCents={currentAmountCents}
                  campaignId={card.campaign_id}
                  basePath={basePath}
                />
              );
            }

            if (card.style === "minimal") {
              return (
                <MinimalDonationCard
                  key={card.id}
                  organizationName={organizationName}
                  slug={slug}
                  designSet={designSet ?? undefined}
                  headerImageUrl={formHeaderImageUrl}
                  buttonColor={card.button_color ?? formButtonColor}
                  buttonTextColor={card.button_text_color ?? formButtonTextColor}
                  borderRadius={formBorderRadius ?? undefined}
                  basePath={basePath}
                />
              );
            }

            if (card.style === "compressed") {
              return (
                <CompressedDonationCard
                  key={card.id}
                  organizationName={organizationName}
                  slug={slug}
                  headerImageUrl={formHeaderImageUrl}
                  headerText={designSet?.title ?? formHeaderText}
                  subheaderText={designSet?.subtitle ?? formSubheaderText}
                  designSets={designSets}
                  buttonColor={card.button_color ?? formButtonColor}
                  buttonTextColor={card.button_text_color ?? formButtonTextColor}
                  borderRadius={formBorderRadius ?? undefined}
                  basePath={basePath}
                />
              );
            }

            if (card.style === "full") {
              const filteredDesignSets = designSets.filter((s) => s && (s.media_url || s.title || s.subtitle)) ?? [];
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px", amount: 0.2 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                  style={{ borderRadius: formBorderRadius ?? "0.5rem", fontFamily: fontFamilyResolved }}
                >
                  {filteredDesignSets.length > 0 ? (
                    filteredDesignSets.map((set, i) => (
                      <FormCardMedia
                        key={i}
                        set={set}
                        fallbackImageUrl={formHeaderImageUrl ?? DEFAULT_HEADER_IMAGE_URL}
                        className="h-48"
                        fontFamily={fontFamilyResolved}
                        titleFontWeight={headerFontWeight ?? 700}
                      />
                    ))
                  ) : (
                    <div className="relative h-48 w-full overflow-hidden">
                      <img src={formHeaderImageUrl ?? DEFAULT_HEADER_IMAGE_URL} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                      <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                        <h3 className="text-xl font-bold leading-tight" style={{ fontFamily: fontFamilyResolved, fontWeight: headerFontWeight ?? 700 }}>
                          {formHeaderText ?? "Make a Donation"}
                        </h3>
                        <p className="mt-1 text-sm opacity-95">{formSubheaderText ?? `Support ${organizationName}`}</p>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <DonationForm
                      organizationId={organizationId}
                      organizationName={organizationName}
                      campaigns={campaigns}
                      endowmentFunds={endowmentFunds}
                      suggestedAmounts={suggestedAmounts}
                      minimumAmountCents={minimumAmountCents}
                      showEndowmentSelection={showEndowmentSelection}
                      allowCustomAmount={allowCustomAmount}
                      allowAnonymous={allowAnonymous}
                      buttonColor={card.button_color ?? formButtonColor}
                      buttonTextColor={card.button_text_color ?? formButtonTextColor}
                      borderRadius={formBorderRadius ?? undefined}
                      slug={slug}
                      noCard
                      initialFrequency={initialFrequency}
                      basePathOverride={basePath}
                      embedCardId={card.id}
                    />
                    <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} />
                  </div>
                </motion.div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </section>
  );
}
