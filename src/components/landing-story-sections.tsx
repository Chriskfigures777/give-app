"use client";

import { motion } from "motion/react";
import Image from "next/image";

const SECTIONS = [
  {
    title: "Built for the way you work",
    body: "Whether you run a church, a nonprofit, or a foundation, Give adapts to your workflow. Set up campaigns, track endowments, and see every donation in one place—without the spreadsheets.",
    image:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=85",
    alt: "Team collaboration",
    imageFirst: true,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "Givers deserve a great experience",
    body: "Beautiful, mobile-friendly forms that match your brand. One-click giving, recurring options, and receipts that make supporters feel valued. Less friction means more giving.",
    image:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=85",
    alt: "Community and connection",
    imageFirst: false,
    accent: "from-cyan-500 to-blue-500",
  },
  {
    title: "Insights that drive impact",
    body: "See trends over time, understand your giver base, and export data when you need it. Dashboards that actually help you make decisions—not just look pretty.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=85",
    alt: "Team meeting",
    imageFirst: true,
    accent: "from-violet-500 to-purple-500",
  },
];

export function LandingStorySections() {
  return (
    <section className="relative bg-white py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Why Give
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Everything your organization needs
          </h2>
        </motion.div>

        {SECTIONS.map((block, i) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.7,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`mb-28 grid items-center gap-12 md:grid-cols-2 md:gap-20 last:mb-0 ${
              !block.imageFirst ? "md:grid-flow-dense" : ""
            }`}
          >
            <div
              className={`group relative ${
                !block.imageFirst ? "md:col-start-2" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl md:aspect-[3/2]">
                <Image
                  src={block.image}
                  alt={block.alt}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
              </div>
              {/* Decorative accent */}
              <div
                className={`absolute -bottom-4 ${
                  block.imageFirst ? "-right-4" : "-left-4"
                } -z-10 h-32 w-32 rounded-3xl bg-gradient-to-br ${block.accent} opacity-20 blur-xl`}
              />
            </div>

            <div
              className={
                !block.imageFirst
                  ? "md:col-start-1 md:row-start-1"
                  : ""
              }
            >
              <motion.div
                initial={{
                  opacity: 0,
                  x: block.imageFirst ? -20 : 20,
                }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: 0.2 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </motion.div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                {block.title}
              </h3>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                {block.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
