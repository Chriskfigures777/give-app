"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Heart, ArrowDown } from "lucide-react";

type Props = {
  organizationName: string;
  embedUrl: string;
  slug: string;
};

export function OrgDonationCta({ organizationName, embedUrl, slug }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(700);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "resize" && typeof e.data.height === "number") {
        setIframeHeight(e.data.height);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <section id="donate" className="relative w-full">
      {/* CTA Banner — dramatic gradient with depth */}
      <div className="relative overflow-hidden py-20 md:py-28">
        {/* Background gradient matching homepage dark aesthetic */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/80 to-slate-950" />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full opacity-30 blur-[100px]" style={{ background: "radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)" }} />
          <div className="absolute -right-24 bottom-1/4 h-[350px] w-[350px] rounded-full opacity-25 blur-[100px]" style={{ background: "radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)" }} />
        </div>

        {/* Grain texture */}
        <div className="grain-overlay absolute inset-0" />

        {/* Top gradient divider */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Icon with glassmorphism background */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl backdrop-blur-xl"
            >
              <Heart className="h-7 w-7 text-emerald-400" />
            </motion.div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Support{" "}
              <span className="shimmer-text">{organizationName}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-emerald-100/60 leading-relaxed">
              Your generosity makes a real difference. Every contribution helps
              advance our mission and create lasting impact.
            </p>

            {/* Scroll hint */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-8"
            >
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex items-center gap-2 text-sm text-white/40"
              >
                <ArrowDown className="h-4 w-4" />
                <span>Give below</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Donation embed — styled container with depth */}
      <div className="relative bg-gradient-to-b from-slate-100 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/10"
          >
            <iframe
              ref={iframeRef}
              src={embedUrl}
              allow="autoplay"
              className="w-full border-0 block"
              style={{
                width: "100%",
                height: `${iframeHeight}px`,
                minHeight: "700px",
                overflow: "hidden",
                margin: 0,
                padding: 0,
              }}
              title={`Donate to ${organizationName}`}
              scrolling="no"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
