"use client";

import Link from "next/link";
import { motion } from "motion/react";

type Props = {
  organizationName: string;
  slug: string;
  title?: string | null;
  goalDescription?: string | null;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  primaryColor?: string | null;
  borderRadius?: string | null;
  goalAmountCents: number;
  currentAmountCents: number;
  campaignId?: string | null;
  basePath?: string;
};

export function GoalCompactDonationCard({
  organizationName,
  slug,
  title,
  goalDescription,
  buttonColor,
  buttonTextColor,
  primaryColor,
  borderRadius = "0.5rem",
  goalAmountCents,
  currentAmountCents,
  campaignId,
  basePath = "",
}: Props) {
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
      className="mx-auto max-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-lg transition-shadow hover:shadow-xl"
      style={{ borderRadius: borderRadius ?? "0.5rem" }}
    >
      <Link href={giveHref} className="block" target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
        <h3 className="text-base font-bold text-slate-900 mb-2">
          {(goalDescription?.trim() || title) ?? `Support ${organizationName}`}
        </h3>
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>Progress</span>
          <span className="font-medium tabular-nums">
            ${formattedCurrent} / ${formattedGoal}
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full overflow-hidden bg-slate-200 mb-3"
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
        <span
          className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
          style={{
            backgroundColor: buttonColor ?? "#059669",
            color: buttonTextColor ?? "#ffffff",
            borderRadius: borderRadius ?? "0.5rem",
          }}
        >
          Donate now
        </span>
      </Link>
    </motion.div>
  );
}
