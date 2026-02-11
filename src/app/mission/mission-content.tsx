"use client";

import { motion } from "motion/react";

const STEPS = [
  {
    title: "We take a 1% transaction fee",
    body: "Open and honest. When a donation is processed, we charge a 1% transaction fee. No hidden costs. You see exactly what goes where.",
  },
  {
    title: "30% of that 1% goes to endowment funds",
    body: "So 30% of our fee—0.3% of each transaction—is sent to endowment funds that create lasting global impact. We manage the investment and make sure it goes toward a good cause. When there's a need in a community, we help facilitate that change.",
  },
  {
    title: "You choose the endowment fund",
    body: "Givers and organizations can pick which endowment fund receives that 30%. Whether it's education, health, environment, or community development, you direct where the impact goes. Our mission is to change the lives of many families, nonprofits, and organizations.",
  },
];

export function MissionContent() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
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

        <div className="mt-16 space-y-12">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm"
            >
              <span className="text-sm font-bold text-emerald-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                {step.title}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-8 text-center"
        >
          <p className="text-lg font-semibold text-slate-900">
            In short: 1% fee. 30% of that 1% goes to an endowment fund. You choose the fund. We manage the investment so it goes toward good causes—changing the lives of families, nonprofits, and organizations, one transaction at a time.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
