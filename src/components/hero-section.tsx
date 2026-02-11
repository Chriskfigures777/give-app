"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=85";
const FLOATING_IMAGE_1 =
  "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&q=80";
const FLOATING_IMAGE_2 =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const float1Ref = useRef<HTMLDivElement>(null);
  const float2Ref = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

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
          tl.fromTo(headline, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 })
            .fromTo(sub, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.5")
            .fromTo(cta, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.4")
            .fromTo(scrollInd, { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.2");

          if (overlayRef.current) {
            gsap.to(overlayRef.current, {
              opacity: 0.92,
              ease: "none",
              scrollTrigger: {
                trigger: scope,
                start: "top top",
                end: "bottom top",
                scrub: 0.5,
              },
            });
          }
          if (float1Ref.current) {
            gsap.to(float1Ref.current, {
              y: -40,
              rotation: -2,
              ease: "none",
              scrollTrigger: { trigger: scope, start: "top top", end: "bottom top", scrub: 1 },
            });
          }
          if (float2Ref.current) {
            gsap.to(float2Ref.current, {
              y: -60,
              rotation: 2,
              ease: "none",
              scrollTrigger: { trigger: scope, start: "top top", end: "bottom top", scrub: 1.2 },
            });
          }
        };
        requestAnimationFrame(() => requestAnimationFrame(run));
      }, scope);
      return () => ctx.revert();
    },
    { scope: containerRef, dependencies: [] }
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-slate-900"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Community and team collaboration"
          fill
          priority
          className="object-cover scale-105"
          sizes="100vw"
        />
      </div>

      {/* Gradient overlay for readability */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/75 to-slate-900/90"
        aria-hidden
      />

      {/* Floating card 1 - top right */}
      <div
        ref={float1Ref}
        className="absolute right-[8%] top-[22%] hidden w-[220px] overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md lg:block"
      >
        <div className="aspect-[4/3] relative">
          <Image
            src={FLOATING_IMAGE_1}
            alt="Team"
            fill
            className="object-cover"
            sizes="220px"
          />
        </div>
        <div className="p-3 text-white/95">
          <p className="text-xs font-medium uppercase tracking-wider text-white/70">
            Givers
          </p>
          <p className="text-xl font-bold">+2,847 this month</p>
        </div>
      </div>

      {/* Floating card 2 - bottom left */}
      <div
        ref={float2Ref}
        className="absolute bottom-[20%] left-[6%] hidden w-[200px] overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md lg:block"
      >
        <div className="flex items-center gap-3 p-3">
          <div className="h-10 w-10 rounded-full bg-emerald-400/90" />
          <div>
            <p className="text-xs text-white/70">New donation</p>
            <p className="font-semibold text-white">$250.00</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl"
        >
          <h1
            ref={headlineRef}
            className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Give more.
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Stress less.
            </span>
          </h1>
          <p
            ref={subRef}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/90 sm:text-xl md:text-2xl"
          >
            Donations for churches and nonprofits. Fast, simple, secure—so you
            can focus on what matters.
          </p>
          <div
            ref={ctaRef}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition hover:bg-white/95 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border-2 border-white/50 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 hover:border-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-white/70"
          >
            <span className="text-xs font-medium uppercase tracking-widest">
              Scroll
            </span>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
