"use client";

import { motion } from "motion/react";
import { DonationForm } from "@/app/give/[slug]/donation-form";
import { GiveSignInPrompt } from "@/app/give/[slug]/give-sign-in-prompt";
import { CompressedDonationCard } from "@/components/compressed-donation-card";

type Campaign = {
  id: string;
  name: string;
  suggested_amounts: unknown;
  minimum_amount_cents: number | null;
  allow_recurring: boolean | null;
  allow_anonymous?: boolean | null;
  goal_amount_cents?: number | null;
  current_amount_cents?: number | null;
};
import type { DesignSet } from "@/lib/stock-media";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";
import { getGoogleFontUrl, getFontFamily, getHeaderFontWeight } from "@/lib/form-fonts";
import { FormCardMedia } from "@/components/form-card-media";

type EndowmentFund = { id: string; name: string };

type Props = {
  organizationId: string;
  organizationName: string;
  slug: string;
  campaigns: Campaign[];
  endowmentFunds: EndowmentFund[];
  suggestedAmounts: number[];
  minimumAmountCents: number;
  showEndowmentSelection: boolean;
  allowCustomAmount: boolean;
  allowAnonymous: boolean;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  borderRadius?: string | null;
  headerImageUrl?: string | null;
  headerText?: string | null;
  subheaderText?: string | null;
  fontFamily?: string | null;
  designSets?: DesignSet[] | null;
  initialFrequency?: "monthly" | "yearly";
  formDisplayMode?: "full" | "compressed" | "full_width";
  formMediaSide?: "left" | "right";
  textSide?: "left" | "right";
};

export function OrgDonationSection({
  organizationId,
  organizationName,
  slug,
  campaigns,
  endowmentFunds,
  suggestedAmounts,
  minimumAmountCents,
  showEndowmentSelection,
  allowCustomAmount,
  allowAnonymous,
  buttonColor,
  buttonTextColor,
  borderRadius,
  headerImageUrl,
  headerText,
  subheaderText,
  fontFamily,
  designSets,
  initialFrequency,
  formDisplayMode = "compressed",
  formMediaSide = "left",
  textSide = "left",
}: Props) {
  const fontFamilyResolved = getFontFamily(fontFamily ?? undefined);
  const headerFontWeight = getHeaderFontWeight(fontFamily ?? undefined);
  const googleFontUrl = getGoogleFontUrl(fontFamily ?? undefined);
  const filteredDesignSets =
    designSets?.filter((s) => s && (s.media_url || s.title || s.subtitle)) ?? [];

  const isFullWidth = formDisplayMode === "full_width";
  const mediaLeft = isFullWidth ? formMediaSide === "left" : false;
  const gridDense = isFullWidth ? mediaLeft === false : textSide === "right";

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
            <>
              <div className={`relative min-h-[320px] md:min-h-[480px] ${mediaLeft ? "" : "md:col-start-2"}`}>
                {filteredDesignSets.length > 0 ? (
                  <FormCardMedia
                    set={filteredDesignSets[0]}
                    fallbackImageUrl={headerImageUrl ?? DEFAULT_HEADER_IMAGE_URL}
                    className="absolute inset-0 h-full min-h-[320px] md:min-h-0"
                    fontFamily={fontFamilyResolved}
                    titleFontWeight={headerFontWeight ?? 700}
                  />
                ) : (
                  <div className="absolute inset-0">
                    <img
                      src={headerImageUrl ?? DEFAULT_HEADER_IMAGE_URL}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                  </div>
                )}
              </div>
              <div className={`flex flex-col justify-center px-8 py-12 sm:px-12 md:py-16 ${mediaLeft ? "" : "md:col-start-1 md:row-start-1"}`}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px", amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="max-w-[480px] mx-auto w-full"
                  style={{ fontFamily: fontFamilyResolved }}
                >
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
                    buttonColor={buttonColor}
                    buttonTextColor={buttonTextColor}
                    borderRadius={borderRadius ?? undefined}
                    slug={slug}
                    noCard
                    initialFrequency={initialFrequency}
                    basePathOverride={`/org/${slug}`}
                  />
                  <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} />
                </motion.div>
              </div>
            </>
          ) : (
            <>
          <div className={`flex flex-col justify-center px-8 py-12 sm:px-12 md:py-16 ${textSide === "right" ? "md:col-start-2" : ""}`}>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Make a donation
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Support {organizationName} with a one-time or recurring gift.
            </p>
          </div>
          <div className={`flex flex-col justify-center px-8 py-12 sm:px-12 md:py-16 ${textSide === "right" ? "md:col-start-1 md:row-start-1" : ""}`}>
            {formDisplayMode === "compressed" ? (
              <CompressedDonationCard
                organizationName={organizationName}
                slug={slug}
                headerImageUrl={headerImageUrl}
                headerText={headerText}
                subheaderText={subheaderText}
                designSets={designSets}
                buttonColor={buttonColor}
                buttonTextColor={buttonTextColor}
                borderRadius={borderRadius ?? undefined}
              />
            ) : (
              <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-12 max-w-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          style={{
            borderRadius: borderRadius ?? "0.5rem",
            fontFamily: fontFamilyResolved,
          }}
        >
          {filteredDesignSets.length > 0 ? (
            filteredDesignSets.map((set, i) => (
              <FormCardMedia
                key={i}
                set={set}
                fallbackImageUrl={headerImageUrl ?? DEFAULT_HEADER_IMAGE_URL}
                className="h-48"
                fontFamily={fontFamilyResolved}
                titleFontWeight={headerFontWeight ?? 700}
              />
            ))
          ) : (
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={headerImageUrl ?? DEFAULT_HEADER_IMAGE_URL}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                <h3
                  className="text-xl font-bold leading-tight"
                  style={{ fontFamily: fontFamilyResolved, fontWeight: headerFontWeight ?? 700 }}
                >
                  {headerText ?? "Make a Donation"}
                </h3>
                <p className="mt-1 text-sm opacity-95">
                  {subheaderText ?? `Support ${organizationName}`}
                </p>
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
              buttonColor={buttonColor}
              buttonTextColor={buttonTextColor}
              borderRadius={borderRadius ?? undefined}
              slug={slug}
              noCard
              initialFrequency={initialFrequency}
              basePathOverride={`/org/${slug}`}
            />
            <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} />
          </div>
        </motion.div>
            )}
          </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
