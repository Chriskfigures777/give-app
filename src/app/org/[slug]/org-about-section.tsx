"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { Target, Sparkles, ArrowRight } from "lucide-react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=85";

type Props = {
  summary: string | null;
  mission: string | null;
  goals: string | null;
  imageUrl?: string | null;
  imageSide?: "left" | "right";
  organizationName?: string;
};

export function OrgAboutSection({
  summary,
  mission,
  goals,
  imageUrl,
  imageSide = "left",
  organizationName = "this organization",
}: Props) {
  const hasContent = summary || mission || goals;
  const imageFirst = imageSide === "left";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/60 to-white py-24 md:py-32">
      {/* Decorative floating orbs — matching homepage */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full bg-emerald-100/50 blur-[100px] animate-float" />
        <div className="absolute -right-32 bottom-1/4 h-[360px] w-[360px] rounded-full bg-teal-100/40 blur-[100px] animate-float-delayed" />
        <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-200/60 to-transparent" />
      </div>

      {/* Grain texture overlay */}
      <div className="org-noise absolute inset-0 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 md:mb-20 text-center"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            About Us
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Get to Know{" "}
            <span className="org-gradient-text">{organizationName}</span>
          </h2>
          {summary && (
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              {summary}
            </p>
          )}
          {!summary && (
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400 italic">
              Learn more about our mission and vision.
            </p>
          )}
        </motion.div>

        {/* Hero image + content grid */}
        <div className={`grid items-center gap-12 lg:grid-cols-12 lg:gap-20 ${!imageFirst ? "lg:grid-flow-dense" : ""}`}>
          {/* Large featured image with dramatic treatment */}
          <motion.div
            initial={{ opacity: 0, x: imageFirst ? -50 : 50, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`relative lg:col-span-6 ${!imageFirst ? "lg:col-start-7" : ""}`}
          >
            <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl shadow-emerald-900/10 md:aspect-[3/2]">
              <Image
                src={imageUrl || DEFAULT_IMAGE}
                alt={`About ${organizationName}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Overlay gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/5" />
            </div>

            {/* Decorative accent blob */}
            <div
              className={`absolute -bottom-6 ${
                imageFirst ? "-right-6" : "-left-6"
              } -z-10 h-40 w-40 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 blur-2xl`}
            />

            {/* Corner accent badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute -bottom-4 -right-4 hidden rounded-2xl border border-white/20 bg-white/80 px-5 py-3.5 shadow-xl backdrop-blur-xl lg:block"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Our Mission</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">Making a Difference</p>
            </motion.div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`space-y-6 lg:col-span-6 ${!imageFirst ? "lg:col-start-1 lg:row-start-1" : ""}`}
          >
            {/* Mission card — glassmorphism style */}
            {mission && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="org-about-card group relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/90 via-white/80 to-teal-50/70 p-7 shadow-lg shadow-emerald-900/5 backdrop-blur-sm"
              >
                {/* Subtle gradient accent line at top */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                    <Target className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900">Our Mission</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{mission}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Goals card */}
            {goals && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="org-about-card group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50/90 via-white/80 to-slate-50/70 p-7 shadow-lg shadow-slate-900/5 backdrop-blur-sm"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                    <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900">What We&apos;re Working Toward</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{goals}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CTA link */}
            {hasContent && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <a
                  href="#donate"
                  className="group/link inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5"
                >
                  Support our mission
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </a>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
