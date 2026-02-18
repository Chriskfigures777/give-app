"use client";

import { motion } from "motion/react";

export function MissionHero() {
  return (
    <section className="hero-mesh grain-overlay relative min-h-[65vh] overflow-hidden">
      <div className="orb orb-emerald absolute -left-32 top-1/4 h-[500px] w-[500px]" />
      <div className="orb orb-cyan absolute -right-24 bottom-0 h-[400px] w-[400px]" />
      <div className="orb orb-violet absolute bottom-1/4 right-1/3 h-[300px] w-[300px]" />

      <div className="relative z-10 flex min-h-[65vh] flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm backdrop-blur-sm"
        >
          <span className="text-white/60">Our purpose</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7 }}
          className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl"
        >
          Our <span className="shimmer-text">Mission</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-3xl text-lg leading-relaxed text-white/70 md:text-xl"
        >
          Change the lives of families, nonprofits, and organizations—and help
          change the communities around us. 1% fee. 30% to endowment funds. You
          choose where it goes.
        </motion.p>

        {/* Visual fee breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          {[
            { value: "1%", label: "Transaction fee" },
            { value: "30%", label: "To endowment" },
            { value: "You", label: "Choose the fund" },
          ].map((item, i) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-6 py-4 backdrop-blur-sm"
            >
              <span className="text-2xl font-extrabold text-emerald-400">
                {item.value}
              </span>
              <span className="text-sm text-white/60">{item.label}</span>
              {i < 2 && (
                <svg
                  className="ml-2 h-4 w-4 text-white/20 hidden sm:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
