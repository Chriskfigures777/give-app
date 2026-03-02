"use client";

import { motion } from "motion/react";
import { UserPlus, Layout, Heart } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "Sign up in minutes",
    description:
      "Create your organization and connect your Stripe account. No setup fees, no monthly plans.",
    gradient: "from-emerald-500 to-teal-600",
    number: "01",
  },
  {
    icon: Layout,
    title: "Create campaigns",
    description:
      "Build donation forms and embed them on your website. Customize colors, fields, and messaging—free.",
    gradient: "from-cyan-500 to-blue-600",
    number: "02",
  },
  {
    icon: Heart,
    title: "Accept donations",
    description:
      "Fees apply only when a donation is processed. Until then, the platform is completely free to use.",
    gradient: "from-violet-500 to-purple-600",
    number: "03",
  },
];

export function PricingHowItWorks() {
  return (
    <section className="relative bg-white py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Start accepting donations immediately
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Three simple steps to go from signup to your first donation. No
            technical expertise needed.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="landing-card group relative overflow-hidden p-8"
            >
              <span className="absolute right-4 top-4 text-6xl font-extrabold text-slate-100 transition-colors group-hover:text-emerald-50">
                {step.number}
              </span>
              <div
                className={`relative z-10 mb-5 inline-flex rounded-2xl bg-gradient-to-br ${step.gradient} p-3.5 shadow-lg`}
              >
                <step.icon
                  className="h-5 w-5 text-white"
                  strokeWidth={2}
                />
              </div>
              <h3 className="relative z-10 text-xl font-bold text-slate-900">
                {step.title}
              </h3>
              <p className="relative z-10 mt-3 text-[15px] leading-relaxed text-slate-600">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
