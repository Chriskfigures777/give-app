"use client";

import { motion } from "motion/react";
import Image from "next/image";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=85";

export function AboutHero() {
  return (
    <section className="relative min-h-[50vh] overflow-hidden bg-slate-900">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Team"
          fill
          className="object-cover opacity-60"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-slate-900/90" />
      </div>
      <div className="relative z-10 flex min-h-[50vh] flex-col items-center justify-center px-6 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
        >
          About Us
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-4 max-w-xl text-lg text-white/90"
        >
          Meet Christopher Figures and the team behind Give. We’re here to help you give back and change communities.
        </motion.p>
      </div>
    </section>
  );
}
