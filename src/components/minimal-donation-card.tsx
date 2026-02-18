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
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  borderRadius?: string | null;
  basePath?: string;
};

export function MinimalDonationCard({
  organizationName,
  slug,
  designSet,
  headerImageUrl,
  buttonColor,
  buttonTextColor,
  borderRadius = "0.5rem",
  basePath = "",
}: Props) {
  const imageUrl =
    designSet?.media_type === "image" && designSet?.media_url
      ? designSet.media_url
      : headerImageUrl ?? DEFAULT_HEADER_IMAGE_URL;
  const isVideo = designSet?.media_type === "video" && designSet?.media_url;

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
      className="mx-auto max-w-[240px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition-shadow hover:shadow-xl"
      style={{ borderRadius: borderRadius ?? "0.5rem" }}
    >
      <Link href={giveHref} className="block" target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
        <div className="relative aspect-square overflow-hidden">
          {isVideo ? (
            <video
              src={designSet!.media_url!}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              aria-hidden
            />
          ) : (
            <Image
              src={imageUrl}
              alt={organizationName}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="240px"
            />
          )}
        </div>
        <div className="p-3">
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
        </div>
      </Link>
    </motion.div>
  );
}
