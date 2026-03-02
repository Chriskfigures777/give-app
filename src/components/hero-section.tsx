"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { HeroSearch } from "./hero-search";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import type { PlatformStats } from "@/lib/platform-stats";
import { useDonations } from "@/lib/use-donations";
import { usePricingModal } from "@/lib/use-pricing-modal";

gsap.registerPlugin(ScrollTrigger);

const TRUST_BADGES = [
  { icon: Shield, label: "PCI Compliant" },
  { icon: Zap, label: "Instant Setup" },
  { icon: Globe, label: "256-bit Encryption" },
];

/* ── Pexels church video (HD, royalty-free) ── */
const PEXELS_VIDEO_ID = 3249935;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function HeroSection({ stats }: { stats?: PlatformStats }) {
  const containerRef = useRef<HTMLElement>(null);
  const { openPricingModal } = usePricingModal();
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  /* ── Pexels video state ── */
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  /* ── Live donations from shared context ── */
  const { donations } = useDonations();
  const [currentDonation, setCurrentDonation] = useState<{ id: string; amount_cents: number; donor_initial: string; donor_display: string; org_name: string | null; created_at: string } | null>(null);
  const rotationIdx = useRef(0);

  /* Sync currentDonation when donations load */
  useEffect(() => {
    if (donations.length > 0) setCurrentDonation((prev) => prev ?? donations[0] ?? null);
  }, [donations]);

  /* Fetch Pexels video on mount */
  useEffect(() => {
    fetch(`/api/pexels/video/${PEXELS_VIDEO_ID}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.mp4Url) setVideoUrl(d.mp4Url);
      })
      .catch(() => {});
  }, []);

  /* Rotate through donations every 5s */
  useEffect(() => {
    if (donations.length <= 1) return;
    const interval = setInterval(() => {
      rotationIdx.current = (rotationIdx.current + 1) % donations.length;
      setCurrentDonation(donations[rotationIdx.current] ?? null);
    }, 5000);
    return () => clearInterval(interval);
  }, [donations]);

  /* Stats: count unique donors this month */
  const donorCount = donations.length;
  const totalCents = donations.reduce((sum, d) => sum + d.amount_cents, 0);

  useGSAP(
    () => {
      const scope = containerRef.current;
      if (!scope) return;
      const ctx = gsap.context(() => {
        const run = () => {
          const headline = headlineRef.current;
          const sub = subRef.current;
          const cta = ctaRef.current;
          const scrollInd = scrollIndicatorRef.current;
          if (!headline || !sub || !cta || !scrollInd) return;

          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
          tl.fromTo(
            headline,
            { y: 80, opacity: 0, filter: "blur(8px)" },
            { y: 0, opacity: 1, filter: "blur(0px)", duration: 1 }
          )
            .fromTo(sub, { y: 50, opacity: 0, filter: "blur(4px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8 }, "-=0.6")
            .fromTo(cta, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.4")
            .fromTo(scrollInd, { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.2");
        };
        requestAnimationFrame(() => requestAnimationFrame(run));
      }, scope);
      return () => ctx.revert();
    },
    { scope: containerRef, dependencies: [] }
  );

  return (
    <section ref={containerRef} className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* Video background */}
      {videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      ) : (
        <div className="hero-mesh absolute inset-0" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/50 to-slate-950/90" />

      {/* Grain texture */}
      <div className="grain-overlay absolute inset-0" />

      {/* Decorative orbs */}
      <div className="orb orb-emerald absolute -left-32 top-1/4 h-[500px] w-[500px] animate-float" />
      <div className="orb orb-cyan absolute -right-24 top-1/3 h-[400px] w-[400px] animate-float-delayed" />

      {/* Floating donation card — REAL LIVE DATA */}
      <AnimatePresence mode="wait">
        {currentDonation && (
          <motion.div
            key={currentDonation.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-[6%] top-[18%] hidden w-[260px] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl lg:block"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                {currentDonation.donor_initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                  New donation
                </p>
                <p className="text-xl font-bold text-white">
                  ${(currentDonation.amount_cents / 100).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="mt-3 flex items-center justify-between">
              <p className="truncate text-xs text-white/40">
                {currentDonation.donor_display}
                {currentDonation.org_name ? ` to ${currentDonation.org_name}` : ""}
              </p>
              <p className="shrink-0 text-xs text-white/30">{timeAgo(currentDonation.created_at)}</p>
            </div>
            {/* Live indicator */}
            <div className="absolute right-3 top-3 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10px] font-medium text-emerald-400">LIVE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Givers count card — REAL DATA */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-[22%] left-[5%] hidden w-[220px] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl lg:block"
      >
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
          Recent donations
        </p>
        <p className="mt-1 text-3xl font-bold text-white">
          {donorCount > 0 ? donorCount : "—"}
        </p>
        {totalCents > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
              ${(totalCents / 100).toLocaleString()}
            </span>
            <span className="text-[11px] text-white/40">total raised</span>
          </div>
        )}
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-5xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm backdrop-blur-sm"
          >
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-white/70">
              Trusted by{" "}
              <span className="font-semibold text-white">
                {stats?.totalOrganizations
                  ? stats.totalOrganizations.toLocaleString()
                  : "—"}
              </span>{" "}
              {stats?.totalOrganizations === 1 ? "organization" : "organizations"} worldwide
            </span>
          </motion.div>

          <h1
            ref={headlineRef}
            className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Give more.
            <br />
            <span className="shimmer-text">Stress less.</span>
          </h1>

          <p
            ref={subRef}
            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl md:text-2xl"
          >
            The free donation platform for churches and nonprofits.
            <br className="hidden sm:block" />
            Sign up free. Connect free. Give more.
          </p>

          {/* Search */}
          <div className="mt-12 w-full max-w-2xl mx-auto">
            <HeroSearch />
          </div>

          {/* CTAs */}
          <div ref={ctaRef} className="mt-8 flex flex-col items-center gap-8">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/explore"
                className="glow-btn group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl"
              >
                Find a cause
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/signup"
                className="glow-btn inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.08] px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.12]"
              >
                Sign up free — no credit card
              </Link>
              <button
                type="button"
                onClick={openPricingModal}
                className="glow-btn inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.05] px-8 py-4 text-base font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/[0.08] hover:text-white"
              >
                See pricing
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-white/40">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-white/40">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                </svg>
                <span className="text-xs font-medium">Powered by Stripe</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <div ref={scrollIndicatorRef} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-10 w-6 rounded-full border-2 border-white/20 p-1">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="h-2 w-2 rounded-full bg-white/50"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
