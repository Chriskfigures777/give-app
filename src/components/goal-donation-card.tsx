"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";
import type { DesignSet } from "@/lib/stock-media";

type Props = {
  organizationName: string;
  slug: string;
  designSet?: DesignSet | null;
  headerImageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  goalDescription?: string | null;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  primaryColor?: string | null;
  borderRadius?: string | null;
  goalAmountCents: number;
  currentAmountCents: number;
  goalDeadline?: string | null;
  campaignId?: string | null;
  basePath?: string;
};

export function GoalDonationCard({
  organizationName,
  slug,
  designSet,
  headerImageUrl,
  title,
  subtitle,
  goalDescription,
  buttonColor,
  buttonTextColor,
  primaryColor,
  borderRadius = "0.5rem",
  goalAmountCents,
  currentAmountCents,
  goalDeadline,
  campaignId,
  basePath = "",
}: Props) {
  const imageUrl =
    designSet?.media_type === "image" && designSet?.media_url
      ? designSet.media_url
      : headerImageUrl ?? DEFAULT_HEADER_IMAGE_URL;
  const displayTitle = designSet?.title ?? title ?? "Make a Donation";
  const displaySubtitle =
    (goalDescription?.trim() || designSet?.subtitle) ?? subtitle ?? `Support ${organizationName}`;

  let giveHref = basePath ? `${basePath.replace(/\/$/, "")}/give/${slug}` : `/give/${slug}`;
  if (campaignId) giveHref += `?campaign=${campaignId}`;
  const isExternal = giveHref.startsWith("http");

  const progressPercent =
    goalAmountCents > 0
      ? Math.min(100, (Number(currentAmountCents) / Number(goalAmountCents)) * 100)
      : 0;
  const accentColor = primaryColor ?? buttonColor ?? "#059669";

  const formattedCurrent = (Number(currentAmountCents) / 100).toLocaleString();
  const formattedGoal = (Number(goalAmountCents) / 100).toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px", amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-shadow hover:shadow-2xl"
      style={{ borderRadius: borderRadius ?? "0.5rem" }}
    >
      <Link href={giveHref} className="block" target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageUrl}
            alt={organizationName}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="360px"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
            <h3 className="text-lg font-bold leading-tight" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)" }}>{displayTitle}</h3>
            <p className="mt-1 text-sm" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)" }}>{displaySubtitle}</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Goal progress</span>
              <span className="font-medium tabular-nums">
                ${formattedCurrent} / ${formattedGoal}
              </span>
            </div>
            <div
              className="h-2.5 w-full rounded-full overflow-hidden bg-slate-200"
              style={{ borderRadius: borderRadius ?? "0.5rem" }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  backgroundColor: accentColor,
                  borderRadius: borderRadius ?? "0.5rem",
                }}
              />
            </div>
          </div>
          {goalDeadline && (
            <p className="text-xs text-slate-500">By {formattedDeadline(goalDeadline)}</p>
          )}
          <span
            className="inline-flex w-full items-center justify-center rounded-lg px-6 py-3 font-semibold text-white transition hover:opacity-95"
            style={{
              backgroundColor: buttonColor ?? "#059669",
              color: buttonTextColor ?? "#ffffff",
              borderRadius: borderRadius ?? "0.5rem",
            }}
          >
            Donate now
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function formattedDeadline(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}
