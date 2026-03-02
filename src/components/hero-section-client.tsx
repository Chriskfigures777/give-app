"use client";

import dynamic from "next/dynamic";
import type { PlatformStats } from "@/lib/platform-stats";

const HeroSection = dynamic(
  () => import("./hero-section").then((m) => ({ default: m.HeroSection })),
  {
    ssr: false,
    loading: () => (
      <section className="hero-mesh relative min-h-screen w-full overflow-hidden">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            </div>
          </div>
        </div>
      </section>
    ),
  }
);

export function HeroSectionClient({ stats }: { stats?: PlatformStats }) {
  return <HeroSection stats={stats} />;
}
