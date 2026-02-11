"use client";

import Image from "next/image";
import { motion } from "motion/react";

const BANNER_IMAGE =
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=80";

type Props = { userName: string | null };

export function DashboardWelcomeBanner({ userName }: Props) {
  const displayName = userName?.split(" ")[0] ?? "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-emerald-900/40 to-teal-900/50 shadow-xl"
    >
      <div className="absolute inset-0">
        <Image
          src={BANNER_IMAGE}
          alt=""
          fill
          className="object-cover opacity-40"
          sizes="(max-width: 768px) 100vw, 1200px"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
      </div>
      <div className="relative z-10 flex flex-col justify-center px-8 py-10 sm:px-10 md:flex-row md:items-center md:justify-between md:py-12">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-300/90">
            Welcome back
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Welcome back, {displayName}
          </h2>
          <p className="mt-2 max-w-md text-white/80">
            Here’s what’s happening with your donations and organizations today.
          </p>
        </div>
        <div className="mt-6 flex gap-3 md:mt-0">
          <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
            <p className="text-xs font-medium text-white/70">Quick actions</p>
            <p className="text-sm font-semibold text-white">View donations</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
