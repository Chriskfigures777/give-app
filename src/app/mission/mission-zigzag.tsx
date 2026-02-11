"use client";

import { motion } from "motion/react";
import Image from "next/image";

const SECTIONS = [
  {
    title: "We take a 1% transaction fee",
    body: "Open and honest. When a donation is processed, we charge a 1% transaction fee. No hidden costs. You see exactly what goes where—so you can focus on your mission instead of spreadsheets.",
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=85",
    alt: "Community and connection",
    imageFirst: true,
  },
  {
    title: "30% of that 1% goes to endowment funds",
    body: "So 30% of our fee—0.3% of each transaction—is sent to endowment funds that create lasting global impact. We manage the investment and make sure it goes toward a good cause. When there's a need in a community, we help facilitate that change.",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=85",
    alt: "Team collaboration",
    imageFirst: false,
  },
  {
    title: "You choose the endowment fund",
    body: "Givers and organizations can pick which endowment fund receives that 30%. Whether it's education, health, environment, or community development, you direct where the impact goes. Our mission is to change the lives of families, nonprofits, and organizations.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=85",
    alt: "People meeting",
    imageFirst: true,
  },
  {
    title: "Impact by design",
    body: "In short: 1% fee. 30% of that 1% goes to an endowment fund. You choose the fund. We manage the investment so it goes toward good causes—changing the lives of families, nonprofits, and organizations, one transaction at a time.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=85",
    alt: "Community giving",
    imageFirst: false,
  },
];

export function MissionZigzag() {
  return (
    <section className="relative bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            How it works
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Giving back, by design
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            We want to help change the communities around us. So we built giving back into the product—and we manage every investment so it goes toward a good cause.
          </p>
        </motion.div>

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
                {String(i + 1).padStart(2, "0")}
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
