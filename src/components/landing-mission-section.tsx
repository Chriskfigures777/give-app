"use client";

import { motion } from "motion/react";
import Link from "next/link";

const HIGHLIGHTS = [
  {
    label: "1% transaction fee",
    description: "Transparent. When a donation is processed, we charge a 1% fee. No hidden costs.",
  },
  {
    label: "30% to endowment funds",
    description: "30% of that 1% goes to endowment funds—creating lasting global impact.",
  },
  {
    label: "You choose the cause",
    description: "Givers and organizations direct where that impact goes: education, health, community.",
  },
];

export function LandingMissionSection() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(16,185,129,0.15),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Our mission
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Change the lives of families, nonprofits, and organizations
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85">
            We help change the communities around us. A 1% transaction fee keeps things simple—and 30% of that fee goes to endowment funds that make an impact globally. We manage every investment so it goes toward real good: when there’s a need, we make sure the funds get there.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px", amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-emerald-500/30 hover:bg-white/10"
            >
              <p className="text-base font-semibold text-emerald-400">{item.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 text-center"
        >
          <Link
            href="/mission"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Our mission in detail
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
