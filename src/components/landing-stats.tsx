"use client";

import { motion } from "motion/react";
import Image from "next/image";

const STATS = [
  { value: "2M+", label: "Donations processed" },
  { value: "50k+", label: "Organizations" },
  { value: "99.9%", label: "Uptime" },
];

const IMAGE_LEFT =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80";
const IMAGE_RIGHT =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80";

export function LandingStats() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900/30 py-24 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
      <div className="absolute left-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-teal-500/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col items-center gap-12 lg:flex-row lg:justify-between"
        >
          <div className="flex flex-1 flex-col items-center gap-8 md:flex-row md:gap-12">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/20 shadow-xl md:h-28 md:w-28">
              <Image
                src={IMAGE_LEFT}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-12 md:gap-16">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/70">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
            <div className="relative hidden h-24 w-24 overflow-hidden rounded-2xl border border-white/20 shadow-xl md:block md:h-28 md:w-28">
              <Image
                src={IMAGE_RIGHT}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
