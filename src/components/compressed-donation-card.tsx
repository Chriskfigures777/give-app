"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";
import type { DesignSet } from "@/lib/stock-media";

type Props = {
  organizationName: string;
  slug: string;
  headerImageUrl?: string | null;
  headerText?: string | null;
  subheaderText?: string | null;
  designSets?: DesignSet[] | null;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  borderRadius?: string | null;
  basePath?: string;
};

export function CompressedDonationCard({
  organizationName,
  slug,
  headerImageUrl,
  headerText,
  subheaderText,
  designSets,
  buttonColor,
  buttonTextColor,
  borderRadius = "0.5rem",
  basePath = "",
}: Props) {
  const filteredDesignSets =
    designSets?.filter((s) => s && (s.media_url || s.title || s.subtitle)) ?? [];
  const firstSet = filteredDesignSets[0];
  const mediaUrl = firstSet?.media_url?.trim() || null;
  const isVideo = firstSet?.media_type === "video" && mediaUrl;
  const imageUrl = !isVideo
    ? (mediaUrl || headerImageUrl || DEFAULT_HEADER_IMAGE_URL)
    : null;

  const giveHref = basePath
    ? `${basePath.replace(/\/$/, "")}/give/${slug}`
    : `/give/${slug}`;
  const isExternal = giveHref.startsWith("http");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px", amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="mx-auto mt-12 max-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-shadow hover:shadow-2xl"
      style={{ borderRadius: borderRadius ?? "0.5rem" }}
    >
      <Link href={giveHref} className="group block" target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
        <div className="relative aspect-[4/3] overflow-hidden">
          {isVideo ? (
            <video
              src={mediaUrl!}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              aria-hidden
            />
          ) : (
            <Image
              src={imageUrl!}
              alt={organizationName}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="320px"
            />
          )}
          <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
            <h3 className="text-lg font-bold leading-tight" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)" }}>
              {headerText ?? "Make a Donation"}
            </h3>
            <p className="mt-1 text-sm" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)" }}>
              {subheaderText ?? `Support ${organizationName}`}
            </p>
          </div>
        </div>
        <div className="p-5">
          <span
            className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
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
