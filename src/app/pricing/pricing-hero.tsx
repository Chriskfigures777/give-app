"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PlatformStats } from "@/lib/platform-stats";

export function PricingHero({ stats }: { stats: PlatformStats }) {
  return (
    <section className="hero-mesh grain-overlay relative min-h-[60vh] overflow-hidden">
      <div className="orb orb-emerald absolute -right-32 top-1/4 h-[500px] w-[500px]" />
      <div className="orb orb-cyan absolute -left-24 bottom-0 h-[400px] w-[400px]" />

      <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm backdrop-blur-sm"
        >
          <span className="text-emerald-400 font-semibold">$0</span>
          <span className="text-white/60">to get started</span>
          <span className="mx-1 text-white/20">·</span>
          <span className="text-white/60">
            <span className="font-semibold text-white">
              {stats.totalOrganizations.toLocaleString()}
            </span>{" "}
            {stats.totalOrganizations === 1 ? "org" : "orgs"} trust Give
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7 }}
          className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl"
        >
          Simple, <span className="shimmer-text">transparent</span>
          <br />
          pricing
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl"
        >
          Free plan: unlimited donations, embeds, events, goals, givers, messaging, form customization, and more. Website ($35) and Pro ($49) plans include a 14-day free trial—no charge for two weeks.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10"
        >
          <Link
            href="/signup"
            className="glow-btn group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl"
          >
            Get Started for Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
