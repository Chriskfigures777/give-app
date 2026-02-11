"use client";

import { motion } from "motion/react";
import Image from "next/image";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1920&q=85";

export function MissionHero() {
  return (
    <section className="relative min-h-[50vh] overflow-hidden bg-slate-900">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Community"
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
          Our Mission
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-4 max-w-2xl text-lg text-white/90"
        >
          Our mission is to change the lives of families, nonprofits, and organizations—and to help change the communities around us. 1% fee. 30% to endowment funds. You choose where it goes.
        </motion.p>
      </div>
    </section>
  );
}
