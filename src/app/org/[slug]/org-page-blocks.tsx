"use client";

import Image from "next/image";
import { motion } from "motion/react";

type BlockConfig = {
  media_url?: string | null;
  title?: string | null;
  subtitle?: string | null;
};

type PublicPageBlock = {
  id: string;
  block_type: "video" | "image";
  sort_order: number;
  config: BlockConfig;
  is_enabled: boolean;
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=85";

type Props = {
  blocks: PublicPageBlock[];
};

export function OrgPageBlocks({ blocks }: Props) {
  const enabledBlocks = blocks
    .filter((b) => b.is_enabled)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (enabledBlocks.length === 0) return null;

  return (
    <section className="relative bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="grid gap-6 md:gap-8">
          {enabledBlocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="org-block-hover group relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-slate-900/20 ring-1 ring-white/5">
                <div className="relative aspect-[21/9] min-h-[260px] md:aspect-[2.8/1] md:min-h-[320px]">
                  {block.block_type === "video" && block.config?.media_url ? (
                    <>
                      <video
                        src={block.config.media_url}
                        muted
                        loop
                        autoPlay
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/10" />
                    </>
                  ) : (
                    <>
                      <Image
                        src={block.config?.media_url || DEFAULT_IMAGE}
                        alt={block.config?.title || "Organization"}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 1200px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/10" />
                    </>
                  )}

                  {/* Text overlay with better typography */}
                  <div className="absolute inset-0 flex flex-col items-center justify-end px-8 pb-10 text-center">
                    {block.config?.title && (
                      <h2 className="text-3xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-5xl tracking-tight">
                        {block.config.title}
                      </h2>
                    )}
                    {block.config?.subtitle && (
                      <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg md:text-xl leading-relaxed">
                        {block.config.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Decorative corner gradient */}
                  <div className="absolute bottom-0 left-0 h-32 w-32 bg-gradient-to-tr from-emerald-500/10 to-transparent pointer-events-none" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
