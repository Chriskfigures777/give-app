"use client";

import { motion } from "motion/react";
import Image from "next/image";

const SECTIONS = [
  {
    title: "Built for the way you work",
    body: "Whether you run a church, a nonprofit, or a foundation, Give adapts to your workflow. Set up campaigns, track endowments, and see every donation in one place—without the spreadsheets.",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=85",
    alt: "Team collaboration",
    imageFirst: true,
  },
  {
    title: "Givers deserve a great experience",
    body: "Beautiful, mobile-friendly forms that match your brand. One-click giving, recurring options, and receipts that make supporters feel valued. Less friction means more giving.",
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=85",
    alt: "Community and connection",
    imageFirst: false,
  },
  {
    title: "Insights that drive impact",
    body: "See trends over time, understand your giver base, and export data when you need it. Dashboards that actually help you make decisions—not just look pretty.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=85",
    alt: "Team meeting",
    imageFirst: true,
  },
];

export function LandingStorySections() {
  return (
    <section className="relative bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {SECTIONS.map((block, i) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px", amount: 0.2 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={`mb-24 grid items-center gap-12 md:grid-cols-2 md:gap-16 last:mb-0 ${
              !block.imageFirst ? "md:grid-flow-dense" : ""
            }`}
          >
            <div
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl md:aspect-[3/2] ${
                !block.imageFirst ? "md:col-start-2" : ""
              }`}
            >
              <Image
                src={block.image}
                alt={block.alt}
                fill
                className="object-cover transition duration-500 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className={!block.imageFirst ? "md:col-start-1 md:row-start-1" : ""}>
              <motion.span
                initial={{ opacity: 0, x: block.imageFirst ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-semibold uppercase tracking-wider text-emerald-600"
              >
                Why Give
              </motion.span>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                {block.title}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                {block.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
