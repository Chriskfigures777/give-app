"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { BookOpen } from "lucide-react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=85";

type Props = {
  story: string | null;
  imageUrl?: string | null;
  imageSide?: "left" | "right";
  organizationName?: string;
};

export function OrgStorySection({
  story,
  imageUrl,
  imageSide = "left",
  organizationName = "this organization",
}: Props) {
  const hasStory = story?.trim();
  const imageFirst = imageSide === "left";

  if (!hasStory) return null;

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 md:py-32">
      {/* Decorative background — matching homepage dark sections */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-1/3 h-[500px] w-[500px] rounded-full opacity-25 blur-[120px]" style={{ background: "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)" }} />
        <div className="absolute -right-32 bottom-1/4 h-[400px] w-[400px] rounded-full opacity-20 blur-[100px]" style={{ background: "radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)" }} />
      </div>

      {/* Grain overlay */}
      <div className="grain-overlay absolute inset-0" />

      {/* Gradient divider at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 md:mb-20 text-center"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 backdrop-blur-sm">
            <BookOpen className="h-3.5 w-3.5" />
            Our Story
          </span>
        </motion.div>

        {/* Content — cinematic two-column */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-3xl bg-slate-900/60 shadow-2xl shadow-black/30 ring-1 ring-white/[0.06] backdrop-blur-xl"
        >
          <div className={`grid md:grid-cols-2 ${!imageFirst ? "md:grid-flow-dense" : ""}`}>
            {/* Image */}
            <div className={`relative aspect-[4/3] md:aspect-auto md:min-h-[440px] ${!imageFirst ? "md:col-start-2" : ""}`}>
              <Image
                src={imageUrl || DEFAULT_IMAGE}
                alt={`Story of ${organizationName}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Overlay gradient toward text side */}
              <div className={`absolute inset-0 ${imageFirst ? "bg-gradient-to-r" : "bg-gradient-to-l"} from-transparent to-slate-900/40 hidden md:block`} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent md:hidden" />
            </div>

            {/* Story text */}
            <div className={`flex flex-col justify-center px-8 py-12 sm:px-12 md:py-16 lg:px-16 ${!imageFirst ? "md:col-start-1 md:row-start-1" : ""}`}>
              {/* Decorative quote mark */}
              <div className="mb-6 text-7xl font-serif leading-none text-emerald-500/30 select-none">
                &ldquo;
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Our Story
              </h2>
              <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />

              <p className="mt-8 text-lg leading-relaxed text-white/70 whitespace-pre-line">
                {story}
              </p>

              {/* Decorative closing quote */}
              <div className="mt-6 text-5xl font-serif leading-none text-emerald-500/20 text-right select-none">
                &rdquo;
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
