"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

const FOUNDER_IMAGE =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480&q=85";

export function FounderSection() {
  return (
    <section className="relative bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-5xl"
        >
          <div className="flex flex-col items-center gap-12 md:flex-row md:items-start md:gap-16">
            <div className="relative shrink-0">
              <div className="relative h-64 w-64 overflow-hidden rounded-2xl shadow-xl md:h-80 md:w-80">
                <Image
                  src={FOUNDER_IMAGE}
                  alt="Christopher Figures"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 256px, 320px"
                  priority
                />
              </div>
              <div className="absolute -bottom-3 -right-3 h-24 w-24 rounded-2xl bg-emerald-500/20" aria-hidden />
            </div>
            <div className="flex-1 text-center md:text-left">
              <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                Founder
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Christopher Figures
              </h2>
              <p className="mt-4 text-lg font-medium text-slate-600">
                Founder &amp; CEO
              </p>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                Christopher leads Give with a focus on transparency and impact. He started the company to make it easier for organizations to accept donations—and to ensure a portion of every transaction supports global endowment funds. His mission is to change the lives of families, nonprofits, and organizations by facilitating real change in communities and managing every investment so it goes toward a good cause.
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
          </div>
        </motion.div>
      </div>
    </section>
  );
}
