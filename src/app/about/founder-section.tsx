"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";

const FOUNDER_IMAGE =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480&q=85";

export function FounderSection() {
  return (
    <section className="relative bg-white py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-5xl"
        >
          <div className="flex flex-col items-center gap-14 md:flex-row md:items-start md:gap-20">
            {/* Photo with decoration */}
            <div className="group relative shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-72 w-72 overflow-hidden rounded-3xl shadow-2xl md:h-[360px] md:w-[360px]"
              >
                <Image
                  src={FOUNDER_IMAGE}
                  alt="Christopher Figures"
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 288px, 360px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </motion.div>
              <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-sm" />
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Founder &amp; CEO
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                Christopher Figures
              </h2>

              <div className="mt-8 relative">
                <Quote className="absolute -left-2 -top-2 h-8 w-8 text-emerald-200 rotate-180" />
                <p className="pl-8 text-lg leading-relaxed text-slate-600 italic">
                  I started Give to make it easier for organizations to accept
                  donations—and to ensure a portion of every transaction supports
                  global endowment funds. My mission is to change the lives of
                  families, nonprofits, and organizations.
                </p>
              </div>

              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                Christopher leads Give with a focus on transparency and impact.
                He manages every investment so it goes toward a good cause—when
                there&apos;s a need in a community, he makes sure the funds get there.
              </p>

              <Link
                href="/mission"
                className="glow-btn group mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
              >
                Our mission
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
