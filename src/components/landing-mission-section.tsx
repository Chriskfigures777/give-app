"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const HIGHLIGHTS = [
  {
    number: "01",
    label: "1% transaction fee",
    description:
      "Transparent and honest. When a donation is processed, we charge a 1% fee. No hidden costs—ever.",
  },
  {
    number: "02",
    label: "30% to endowment funds",
    description:
      "30% of that 1% goes to endowment funds—creating lasting global impact in education, health, and community.",
  },
  {
    number: "03",
    label: "You choose the cause",
    description:
      "Givers and organizations direct where that impact goes. Real transparency. Real choice.",
  },
];

export function LandingMissionSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-28 md:py-36">
      <div className="orb orb-emerald absolute right-0 top-0 h-[500px] w-[500px]" />
      <div className="orb orb-violet absolute -left-32 bottom-0 h-[400px] w-[400px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(16,185,129,0.12),transparent)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Our mission
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Change the lives of families,
            <br />
            nonprofits, and organizations
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-white/60">
            We help change the communities around us. A 1% transaction fee keeps
            things simple—and 30% of that fee goes to endowment funds that make
            a real, lasting impact globally.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm transition-all duration-500 hover:border-emerald-500/20 hover:bg-white/[0.06]"
            >
              <span className="text-5xl font-extrabold text-white/[0.04]">
                {item.number}
              </span>
              <p className="mt-4 text-lg font-bold text-emerald-400">
                {item.label}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-white/60">
                {item.description}
              </p>
              <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-emerald-500/[0.04] transition-all duration-500 group-hover:scale-[2] group-hover:bg-emerald-500/[0.06]" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="mt-16 text-center"
        >
          <Link
            href="/mission"
            className="glow-btn group inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-7 py-4 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
          >
            Our mission in detail
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
