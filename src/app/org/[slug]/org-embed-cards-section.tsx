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
  formDisplayMode?: "full" | "compressed" | "full_width";
  formMediaSide?: "left" | "right";
  textSide?: "left" | "right";
};

export function OrgEmbedCardsSection({
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
  formDisplayMode = "compressed",
  formMediaSide = "left",
  textSide = "left",
}: Props) {
  const fontFamilyResolved = getFontFamily(formFontFamily ?? undefined);
  const headerFontWeight = getHeaderFontWeight(formFontFamily ?? undefined);
  const googleFontUrl = getGoogleFontUrl(formFontFamily ?? undefined);
  const basePath = "";
  const isFullWidth = formDisplayMode === "full_width";
  const mediaLeft = isFullWidth ? formMediaSide === "left" : false;
  const gridDense = isFullWidth ? !mediaLeft : textSide === "right";

  return (
    <section className="relative bg-white py-24 md:py-32">
      {googleFontUrl && (
        <link rel="stylesheet" href={googleFontUrl} />
      )}
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className={`overflow-hidden rounded-3xl bg-white md:grid md:grid-cols-2 ${gridDense ? "md:grid-flow-dense" : ""}`}
        >
          {isFullWidth ? (
            <div className={`relative min-h-[320px] md:min-h-[480px] ${mediaLeft ? "" : "md:col-start-2"}`}>
              {cards[0] && (() => {
                const card = cards[0];
                const designSet = card.design_set
                  ? {
                      media_type: (card.design_set.media_type ?? "image") as "image" | "video",
                      media_url: card.design_set.media_url ?? null,
                      title: card.design_set.title ?? null,
                      subtitle: card.design_set.subtitle ?? null,
                    }
                  : null;
                const designSets = designSet ? [designSet] : (formDesignSets ?? []);
                const firstSet = designSets[0];
                if (firstSet && (firstSet.media_url || firstSet.title || firstSet.subtitle)) {
                  return (
                    <FormCardMedia
                      set={firstSet}
                      fallbackImageUrl={formHeaderImageUrl ?? DEFAULT_HEADER_IMAGE_URL}
                      className="absolute inset-0 h-full min-h-[320px] md:min-h-0"
                      fontFamily={fontFamilyResolved}
                      titleFontWeight={headerFontWeight ?? 700}
                    />
                  );
                }
                return (
                  <div className="absolute inset-0">
                    <img
                      src={formHeaderImageUrl ?? DEFAULT_HEADER_IMAGE_URL}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className={`flex flex-col justify-center px-8 py-12 sm:px-12 md:py-16 ${textSide === "right" ? "md:col-start-2" : ""}`}>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Make a donation
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Support {organizationName} with a one-time or recurring gift.
              </p>
            </div>
          )}
          <div className={`flex flex-col justify-center items-center px-8 py-12 sm:px-12 md:py-16 ${isFullWidth ? (mediaLeft ? "" : "md:col-start-1 md:row-start-1") : (textSide === "right" ? "md:col-start-1 md:row-start-1" : "")}`}>
          {cards.map((card) => {
            const effectiveStyle = formDisplayMode === "full_width" ? "full" : (formDisplayMode === "compressed" ? "compressed" : card.style);
            const designSet = card.design_set
              ? {
                  media_type: (card.design_set.media_type ?? "image") as "image" | "video",
                  media_url: card.design_set.media_url ?? null,
                  title: card.design_set.title ?? null,
                  subtitle: card.design_set.subtitle ?? null,
                }
              : null;
            const designSets = designSet ? [designSet] : (formDesignSets ?? []);

            if (effectiveStyle !== "compressed" && (card.style === "goal" || card.style === "goal_compact")) {
              const campaign = card.campaign_id
                ? campaigns.find((c) => c.id === card.campaign_id)
                : null;
              if (
                !campaign ||
                campaign.goal_amount_cents == null ||
                campaign.goal_amount_cents <= 0
              ) {
                return null;
              }
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

            if (effectiveStyle !== "compressed" && card.style === "minimal") {
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

            if (effectiveStyle === "compressed") {
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

            if (effectiveStyle === "full") {
              const filteredDesignSets =
                designSets.filter((s) => s && (s.media_url || s.title || s.subtitle)) ?? [];
              const showMediaOnCard = !isFullWidth;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px", amount: 0.2 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                  style={{
                    borderRadius: formBorderRadius ?? "0.5rem",
                    fontFamily: fontFamilyResolved,
                  }}
                >
                  {showMediaOnCard && filteredDesignSets.length > 0 ? (
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
                  ) : showMediaOnCard ? (
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={formHeaderImageUrl ?? DEFAULT_HEADER_IMAGE_URL}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                      <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                        <h3
                          className="text-xl font-bold leading-tight"
                          style={{
                            fontFamily: fontFamilyResolved,
                            fontWeight: headerFontWeight ?? 700,
                          }}
                        >
                          {formHeaderText ?? "Make a Donation"}
                        </h3>
                        <p className="mt-1 text-sm opacity-95">
                          {formSubheaderText ?? `Support ${organizationName}`}
                        </p>
                      </div>
                    </div>
                  ) : null}
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
        </motion.div>
      </div>
    </section>
  );
}
