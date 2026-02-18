"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";
import { getGoogleFontUrl } from "@/lib/form-fonts";

export type PublicPageBlock = {
  id: string;
  block_type: "video" | "image";
  sort_order: number;
  config: {
    media_url?: string | null;
    title?: string | null;
    subtitle?: string | null;
    campaign_id?: string | null;
    design_set?: {
      media_type?: "image" | "video";
      media_url?: string | null;
      title?: string | null;
      subtitle?: string | null;
    } | null;
  };
};

type Props = {
  blocks: PublicPageBlock[];
  organizationId?: string;
  organizationName?: string;
  slug?: string;
  campaigns?: unknown[];
  endowmentFunds?: { id: string; name: string }[];
  formCustom?: unknown;
  initialFrequency?: "monthly" | "yearly";
};

export function PublicPageTypeform({
  blocks,
}: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = blocks[step];
  const isFirst = step === 0;
  const isLast = step === blocks.length - 1;
  const progress = blocks.length > 0 ? ((step + 1) / blocks.length) * 100 : 0;

  const googleFontUrl = getGoogleFontUrl(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current || current.block_type !== "video") return;
    const url = current.config?.media_url;
    if (url) video.play().catch(() => {});
  }, [step, current]);

  const goNext = () => {
    if (isLast) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (isFirst) return;
    setDirection(-1);
    setStep((s) => s - 1);
  };

  if (blocks.length === 0) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 overflow-hidden bg-slate-800/80">
        <motion.div
          className="h-full rounded-r-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction >= 0 ? 60 : -60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction >= 0 ? -60 : 60 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex flex-col min-h-screen"
        >
          {current.block_type === "video" && (
            <VideoBlock config={current.config} videoRef={videoRef} />
          )}
          {current.block_type === "image" && (
            <ImageBlock config={current.config} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
        <span className="text-sm font-medium text-slate-400">
          {step + 1} of {blocks.length}
        </span>
        <div className="flex gap-3">
          {!isFirst && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border-2 border-slate-500 px-5 py-2.5 font-semibold text-slate-300 transition hover:border-slate-400 hover:bg-slate-700/50"
            >
              Back
            </button>
          )}
          {!isLast && (
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoBlock({
  config,
  videoRef,
}: {
  config: PublicPageBlock["config"];
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const mediaUrl = config?.media_url?.trim() || null;
  const title = config?.title?.trim() || null;
  const subtitle = config?.subtitle?.trim() || null;

  return (
    <div className="relative flex-1 min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {mediaUrl ? (
        <>
          <video
            ref={videoRef}
            src={mediaUrl}
            muted
            loop
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900/90" />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-800" />
      )}
      {(title || subtitle) && (
        <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
          {title && (
            <h2 className="text-3xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-5xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-4 max-w-2xl text-lg text-white/90 sm:text-xl">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ImageBlock({ config }: { config: PublicPageBlock["config"] }) {
  const mediaUrl = config?.media_url?.trim() || null;
  const title = config?.title?.trim() || null;
  const subtitle = config?.subtitle?.trim() || null;
  const imageUrl = mediaUrl || DEFAULT_HEADER_IMAGE_URL;

  return (
    <div className="relative flex-1 min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900/90" />
      {(title || subtitle) && (
        <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
          {title && (
            <h2 className="text-3xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-5xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-4 max-w-2xl text-lg text-white/90 sm:text-xl">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
