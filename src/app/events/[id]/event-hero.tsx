"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=85";

const ALLOWED_IMAGE_HOSTS = [
  "images.unsplash.com",
  "images.pexels.com",
  "img.evbuc.com",
];

function isAllowedImageHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_IMAGE_HOSTS.some((h) => host === h);
  } catch {
    return false;
  }
}

type Props = {
  name: string;
  imageUrl: string | null;
  orgName: string | null;
  orgSlug: string | null;
};

export function EventHero({ name, imageUrl, orgName, orgSlug }: Props) {
  const src = imageUrl?.trim() || DEFAULT_EVENT_IMAGE;

  return (
    <section className="relative min-h-[50vh] overflow-hidden bg-slate-900">
      <div className="absolute inset-0">
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover opacity-60"
          sizes="100vw"
          priority
          unoptimized={!isAllowedImageHost(src)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-slate-900/90" />
      </div>
      <div className="relative z-10 flex min-h-[50vh] flex-col items-center justify-center px-6 py-20 text-center">
        {orgName && orgSlug && (
          <Link
            href={`/give/${orgSlug}`}
            className="text-sm font-medium uppercase tracking-wider text-white/90 hover:text-white transition"
          >
            {orgName}
          </Link>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl"
        >
          {name}
        </motion.h1>
      </div>
    </section>
  );
}
