"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

const STORY_IMAGE =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=85";

export function AboutStorySection() {
  return (
    <section className="relative bg-slate-50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="grid items-center gap-12 md:grid-cols-2 md:gap-16"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl md:aspect-[3/2]">
            <Image
              src={STORY_IMAGE}
              alt="Team and community"
              fill
              className="object-cover transition duration-500 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Our story
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              Built for the way you give
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Give started with a simple idea: donations should be fast, transparent, and secure so organizations can focus on their mission. We build the tools that help churches and nonprofits accept giving online, track impact, and grow their communities—and we put a portion of every transaction back into endowment funds that create change globally.
            </p>
            <Link
              href="/mission"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Our mission
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
