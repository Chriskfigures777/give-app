"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import Link from "next/link";
import { MapPin, Users, ExternalLink, Shield } from "lucide-react";
import { OrgPageActions } from "./org-page-actions";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=85";

const PLACEHOLDER_AVATAR =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80";

type Props = {
  name: string;
  tagline: string | null;
  heroVideoUrl: string | null;
  heroImageUrl: string | null;
  profileImageUrl: string | null;
  city: string | null;
  state: string | null;
  supportersCount: number;
  slug: string;
  organizationId: string;
  embedModalUrl: string;
  websiteUrl?: string | null;
};

export function OrgHero({
  name,
  tagline,
  heroVideoUrl,
  heroImageUrl,
  profileImageUrl,
  city,
  state,
  supportersCount,
  slug,
  organizationId,
  embedModalUrl,
  websiteUrl,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const imageUrl = heroImageUrl || FALLBACK_IMAGE;
  const avatarUrl = profileImageUrl || PLACEHOLDER_AVATAR;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !heroVideoUrl) return;
    video.play().catch(() => {});
  }, [heroVideoUrl]);

  return (
    <section className="relative overflow-hidden bg-slate-950">
      {/* Banner — dramatic full-height hero with depth */}
      <div className="relative h-64 sm:h-72 md:h-80 lg:h-[420px]">
        {heroVideoUrl ? (
          <>
            <video
              ref={videoRef}
              src={heroVideoUrl}
              muted
              loop
              autoPlay
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950/90" />
          </>
        ) : (
          <>
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950/90" />
          </>
        )}

        {/* Floating orbs behind the banner for depth */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-0 h-[300px] w-[300px] rounded-full opacity-20 blur-[80px]" style={{ background: "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)" }} />
          <div className="absolute -right-24 bottom-0 h-[250px] w-[250px] rounded-full opacity-15 blur-[80px]" style={{ background: "radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, transparent 70%)" }} />
        </div>

        {/* Grain texture */}
        <div className="grain-overlay absolute inset-0" />

        {/* Verified badge floating top-right */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="absolute right-6 top-6 hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/70 backdrop-blur-xl lg:flex"
        >
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          Verified organization
        </motion.div>
      </div>

      {/* Profile card overlapping the banner — glassmorphism upgrade */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative -mt-24 sm:-mt-28 rounded-3xl bg-white/95 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-100/80 p-7 sm:p-9 backdrop-blur-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-7">
            {/* Circular profile image with glow ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 -mt-20 sm:-mt-24"
            >
              <div className="relative h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 opacity-60 blur-md" />
                <div className="relative h-full w-full rounded-full overflow-hidden ring-4 ring-white bg-white shadow-xl">
                  <Image
                    src={avatarUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 128px, 160px"
                    priority
                  />
                </div>
              </div>
            </motion.div>

            {/* Name, tagline, meta, actions */}
            <div className="flex-1 pt-4 sm:pt-2 min-w-0">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl"
              >
                {name}
              </motion.h1>

              {tagline && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="mt-2 text-slate-600 sm:text-lg leading-relaxed max-w-2xl"
                >
                  {tagline}
                </motion.p>
              )}

              {/* Meta row — location + supporters + website */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2"
              >
                {(city || state) && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-sm text-slate-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {[city, state].filter(Boolean).join(", ")}
                  </span>
                )}
                {supportersCount > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-sm text-slate-600">
                    <Users className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {supportersCount.toLocaleString()} {supportersCount === 1 ? "supporter" : "supporters"}
                  </span>
                )}
                {websiteUrl && (
                  <Link
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    Website
                  </Link>
                )}
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-6 pt-6 border-t border-slate-100"
              >
                <OrgPageActions organizationId={organizationId} slug={slug} embedModalUrl={embedModalUrl} />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Spacer below profile card */}
      <div className="h-6 sm:h-8 bg-white" />
    </section>
  );
}
