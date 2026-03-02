"use client";

import { motion } from "motion/react";
import { Sparkles, Shield, Eye, Heart } from "lucide-react";

const BENEFITS = [
  {
    icon: Sparkles,
    title: "Simplicity",
    description:
      "No setup fees, no monthly plans. Sign up and start accepting donations immediately.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Shield,
    title: "Trust",
    description:
      "Stripe-powered payments. Secure, compliant, and trusted by millions of organizations worldwide.",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Eye,
    title: "Transparency",
    description:
      "See exactly where every dollar goes. No hidden costs or surprise charges—ever.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Heart,
    title: "Built for nonprofits",
    description:
      "Support your mission without locking into subscriptions. Pay only when you receive donations.",
    gradient: "from-amber-500 to-orange-600",
  },
];

export function PricingWhyChoose() {
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
            Why Choose Give
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Empowering nonprofits without
            <br />
            financial barriers
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            We built Give so organizations can focus on their mission instead of
            spreadsheets and monthly bills.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="landing-card group p-8"
            >
              <div
                className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${benefit.gradient} p-3.5 shadow-lg`}
              >
                <benefit.icon
                  className="h-5 w-5 text-white"
                  strokeWidth={2}
                />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {benefit.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
