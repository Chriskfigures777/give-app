"use client";

import { motion } from "motion/react";

export function AboutHero() {
  return (
    <section className="hero-mesh grain-overlay relative min-h-[60vh] overflow-hidden">
      <div className="orb orb-emerald absolute -right-32 top-0 h-[500px] w-[500px]" />
      <div className="orb orb-cyan absolute -left-24 bottom-0 h-[400px] w-[400px]" />

      <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm backdrop-blur-sm"
        >
          <span className="text-white/60">Our story</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7 }}
          className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl"
        >
          About <span className="shimmer-text">Give</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl"
        >
          Meet the team building the modern donation platform for churches and nonprofits.
          We believe giving should be fast, transparent, and impactful.
        </motion.p>
      </div>
    </section>
  );
}
