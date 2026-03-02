"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STORY_IMAGE =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=85";

export function AboutStorySection() {
  return (
    <section className="relative bg-white py-28 md:py-36 overflow-hidden">
      <div className="orb orb-emerald absolute -right-48 top-0 h-[500px] w-[500px] opacity-30" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid items-center gap-14 md:grid-cols-2 md:gap-20"
        >
          <div className="group relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl md:aspect-[3/2]">
              <Image
                src={STORY_IMAGE}
                alt="Team and community"
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/20 to-transparent" />
            </div>
            <div className="absolute -bottom-4 -left-4 -z-10 h-full w-full rounded-3xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-sm" />
          </div>

          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Our story
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Built for the way you give
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Give started with a simple idea: donations should be fast,
              transparent, and secure so organizations can focus on their mission.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              We build the tools that help churches and nonprofits accept giving
              online, track impact, and grow their communities—and we put a
              portion of every transaction back into endowment funds that create
              change globally.
            </p>
            <Link
              href="/mission"
              className="glow-btn group mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
            >
              Our mission
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
