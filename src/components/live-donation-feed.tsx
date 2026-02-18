"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, ArrowRight, Sparkles } from "lucide-react";
import { useDonations } from "@/lib/use-donations";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DonationItem = {
  id: string;
  amount_cents: number;
  donor_initial: string;
  donor_display: string;
  org_name: string | null;
  created_at: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function formatCents(cents: number): string {
  if (!cents || cents <= 0) return "$0";
  const dollars = cents / 100;
  if (dollars >= 100_000)
    return `$${(dollars / 1_000).toFixed(0)}k`;
  if (dollars >= 1_000)
    return `$${(dollars / 1_000).toFixed(1)}k`;
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const AVATAR_GRADIENTS = [
  "from-emerald-400 to-teal-500",
  "from-cyan-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-lime-400 to-green-500",
  "from-sky-400 to-indigo-500",
  "from-fuchsia-400 to-pink-600",
];

function avatarGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

/* ------------------------------------------------------------------ */
/*  Live-pulse indicator                                               */
/* ------------------------------------------------------------------ */

function LiveIndicator({ isDark }: { isDark: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        isDark
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-emerald-200 bg-emerald-50 text-emerald-600"
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Spotlight: one donation cross-fades at a time (absolute overlay)    */
/* ------------------------------------------------------------------ */

function SpotlightDonation({
  donation,
  isDark,
}: {
  donation: DonationItem;
  isDark: boolean;
}) {
  const grad = avatarGradient(donation.id);

  return (
    <motion.div
      key={donation.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: "easeInOut" }}
      className={`absolute inset-0 flex w-full items-center gap-5 rounded-3xl border p-6 sm:p-7 ${
        isDark
          ? "border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-2xl shadow-emerald-500/5 backdrop-blur-xl"
          : "border-slate-200 bg-white shadow-xl shadow-slate-200/60"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-lg font-bold text-white shadow-lg`}
      >
        {donation.donor_initial}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-base font-semibold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {donation.donor_display}
          </span>
          <span
            className={`shrink-0 text-xs ${isDark ? "text-white/30" : "text-slate-400"}`}
          >
            {timeAgo(donation.created_at)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-emerald-500">
            {formatCents(donation.amount_cents)}
          </span>
          {donation.org_name && (
            <>
              <ArrowRight
                className={`h-3.5 w-3.5 ${isDark ? "text-white/20" : "text-slate-300"}`}
              />
              <span
                className={`truncate text-sm font-medium ${
                  isDark ? "text-white/50" : "text-slate-500"
                }`}
              >
                {donation.org_name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Heart pulse */}
      <div className="flex shrink-0 flex-col items-center">
        <Heart className="h-5 w-5 text-emerald-500" fill="currentColor" />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Vertical activity stream — fixed-height slots, pure opacity fade   */
/* ------------------------------------------------------------------ */

function ActivitySlot({
  donation,
  isDark,
}: {
  donation: DonationItem;
  isDark: boolean;
}) {
  const grad = avatarGradient(donation.id);

  return (
    <div className="relative h-[52px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={donation.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className={`absolute inset-0 flex items-center gap-3 rounded-xl px-4 ${
            isDark ? "bg-white/[0.03]" : "bg-slate-50/80"
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${grad} text-xs font-bold text-white`}
          >
            {donation.donor_initial}
          </div>
          <div className="min-w-0 flex-1">
            <span
              className={`text-sm font-medium ${isDark ? "text-white/70" : "text-slate-700"}`}
            >
              {donation.donor_display}
            </span>
            {donation.org_name && (
              <span className={`text-sm ${isDark ? "text-white/30" : "text-slate-400"}`}>
                {" "}gave to{" "}
                <span className={`font-medium ${isDark ? "text-white/50" : "text-slate-500"}`}>
                  {donation.org_name}
                </span>
              </span>
            )}
          </div>
          <span className="shrink-0 text-sm font-bold text-emerald-500">
            {formatCents(donation.amount_cents)}
          </span>
          <span
            className={`shrink-0 text-xs ${isDark ? "text-white/25" : "text-slate-400"}`}
          >
            {timeAgo(donation.created_at)}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bottom ticker (kept — user liked this)                             */
/* ------------------------------------------------------------------ */

function BottomTicker({
  donations,
  isDark,
}: {
  donations: DonationItem[];
  isDark: boolean;
}) {
  if (!donations.length) return null;

  return (
    <div className="mt-14 overflow-hidden">
      <div
        className={`mb-3 text-center text-xs font-medium uppercase tracking-widest ${
          isDark ? "text-white/20" : "text-slate-300"
        }`}
      >
        Recent activity
      </div>
      <div className="live-ticker-track flex gap-10">
        {[...donations, ...donations].map((d, i) => (
          <div
            key={`ticker-${d.id}-${i}`}
            className={`flex shrink-0 items-center gap-2 text-sm ${
              isDark ? "text-white/30" : "text-slate-400"
            }`}
          >
            <Heart className="h-3 w-3 text-emerald-500/60" fill="currentColor" />
            <span className="font-semibold">{formatCents(d.amount_cents)}</span>
            <span>to</span>
            <span className="font-semibold">{d.org_name ?? "Give"}</span>
            <span className="text-xs opacity-60">&middot; {timeAgo(d.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function LiveDonationFeed({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  const { donations } = useDonations();
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [streamWindow, setStreamWindow] = useState(0);
  const isDark = variant === "dark";

  /* --- Rotate spotlight every 5s -------------------------------- */
  const spotlightTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (donations.length <= 1) return;
    spotlightTimer.current = setInterval(() => {
      setSpotlightIdx((prev) => (prev + 1) % donations.length);
    }, 5000);
    return () => {
      if (spotlightTimer.current) clearInterval(spotlightTimer.current);
    };
  }, [donations.length]);

  /* --- Rotate stream window every 6s (offset from spotlight) ---- */
  const streamTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (donations.length <= 4) return;
    streamTimer.current = setInterval(() => {
      setStreamWindow((prev) => (prev + 1) % donations.length);
    }, 6000);
    return () => {
      if (streamTimer.current) clearInterval(streamTimer.current);
    };
  }, [donations.length]);

  /* --- Visible stream rows -------------------------------------- */
  const STREAM_SIZE = Math.min(4, donations.length);
  const streamRows: DonationItem[] = [];
  for (let i = 0; i < STREAM_SIZE; i++) {
    const idx = (streamWindow + i) % donations.length;
    if (idx !== spotlightIdx) streamRows.push(donations[idx]);
  }

  /* --- Progress dots -------------------------------------------- */
  const dotCount = Math.min(donations.length, 10);

  return (
    <section
      className={`relative overflow-hidden py-20 md:py-28 ${
        isDark ? "bg-slate-950" : "bg-gradient-to-b from-white via-slate-50/50 to-white"
      }`}
    >
      {isDark && (
        <>
          <div className="orb orb-emerald absolute -right-48 top-0 h-[500px] w-[500px]" />
          <div className="orb orb-cyan absolute -left-32 bottom-0 h-[400px] w-[400px]" />
        </>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ---------- Header ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 flex flex-col items-center gap-4 text-center"
        >
          <LiveIndicator isDark={isDark} />
          <h2
            className={`text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Generosity in motion
          </h2>
          <p className={`max-w-2xl text-lg ${isDark ? "text-white/60" : "text-slate-500"}`}>
            Watch real donations flow through Give &mdash; every gift makes an impact.
          </p>
        </motion.div>

        {/* ---------- Content grid ---------- */}
        {donations.length > 0 ? (
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr]">
            {/* LEFT — Spotlight */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full">
                {/* fixed-height container — absolute children crossfade in place */}
                <div className="relative h-[112px]">
                  <AnimatePresence>
                    <SpotlightDonation
                      key={donations[spotlightIdx].id}
                      donation={donations[spotlightIdx]}
                      isDark={isDark}
                    />
                  </AnimatePresence>
                </div>

                {/* progress dots */}
                {dotCount > 1 && (
                  <div className="mt-5 flex items-center justify-center gap-1.5">
                    {Array.from({ length: dotCount }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSpotlightIdx(i)}
                        aria-label={`Show donation ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          i === spotlightIdx
                            ? `w-6 ${isDark ? "bg-emerald-400" : "bg-emerald-500"}`
                            : `w-1.5 ${isDark ? "bg-white/15" : "bg-slate-300"}`
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* sparkle tagline */}
              <div
                className={`mt-6 flex items-center gap-2 text-xs font-medium ${
                  isDark ? "text-white/25" : "text-slate-400"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Cycling through recent donations</span>
              </div>
            </div>

            {/* RIGHT — Activity stream */}
            <div
              className={`overflow-hidden rounded-2xl border p-2 ${
                isDark
                  ? "border-white/[0.06] bg-white/[0.02]"
                  : "border-slate-200/80 bg-white shadow-sm"
              }`}
            >
              <div
                className={`mb-2 flex items-center gap-2 px-4 pt-3 text-xs font-semibold uppercase tracking-wider ${
                  isDark ? "text-white/30" : "text-slate-400"
                }`}
              >
                <Heart className="h-3 w-3" />
                Activity stream
              </div>

              <div className="flex flex-col gap-1">
                {streamRows.map((d, i) => (
                  <ActivitySlot
                    key={`slot-${i}`}
                    donation={d}
                    isDark={isDark}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ---------- Skeleton ---------- */
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div
              className={`h-[120px] animate-pulse rounded-3xl ${
                isDark ? "bg-white/[0.04]" : "bg-slate-100"
              }`}
            />
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-14 animate-pulse rounded-xl ${
                    isDark ? "bg-white/[0.03]" : "bg-slate-50"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ---------- Bottom ticker ---------- */}
        <BottomTicker donations={donations} isDark={isDark} />
      </div>
    </section>
  );
}
