"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Code2, ShieldCheck, Repeat, Globe, Smartphone } from "lucide-react";

const FEATURES = [
  {
    title: "One dashboard for everything",
    description:
      "Track donations, givers, and campaigns in one place. No spreadsheets. No chaos.",
    icon: BarChart3,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "Embed anywhere",
    description:
      "Add a donation form to your site in minutes. Customize colors, fields, and branding.",
    icon: Code2,
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    title: "Secure & compliant",
    description:
      "Stripe-powered payments with PCI compliance. Your givers' data stays safe—always.",
    icon: ShieldCheck,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    title: "Recurring giving",
    description:
      "Let givers set up weekly or monthly giving. Automated. Reliable. Frictionless.",
    icon: Repeat,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    title: "Global reach",
    description:
      "Accept donations from supporters worldwide with multi-currency support.",
    icon: Globe,
    gradient: "from-rose-500 to-pink-600",
  },
  {
    title: "Mobile-first",
    description:
      "Beautiful forms that work perfectly on any device. More accessibility, more giving.",
    icon: Smartphone,
    gradient: "from-indigo-500 to-blue-600",
  },
];

const SOCIAL_PROOF_IMAGE =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80";

const SECTION_IMAGE =
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=700&q=85";

export function LandingFeatures() {
  return (
    <section className="relative bg-gradient-to-b from-white via-slate-50/50 to-white py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header with image */}
        <div className="grid items-center gap-16 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, x: -40, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl shadow-2xl lg:col-span-5"
          >
            <div className="aspect-[16/10] relative">
              <Image
                src={SECTION_IMAGE}
                alt="Team collaboration"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/20 to-transparent" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center lg:col-span-7 lg:text-left"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Purpose-built tools
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Built for ministries
              <br />
              and nonprofits
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 lg:mx-0">
              From small churches to growing organizations—give your givers a
              seamless experience and your team a single source of truth.
            </p>
          </motion.div>
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="landing-card group p-8"
            >
              <div
                className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${feature.gradient} p-3.5 shadow-lg`}
              >
                <feature.icon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Social proof banner */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="mt-24 overflow-hidden rounded-3xl bg-slate-950 shadow-2xl"
        >
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[360px]">
              <Image
                src={SOCIAL_PROOF_IMAGE}
                alt="Community coming together"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-950/40 md:block hidden" />
            </div>
            <div className="flex flex-col justify-center px-8 py-14 md:px-14">
              <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                Trusted by organizations that give back
              </span>
              <h3 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                One platform.
                <br />
                Every donation.
                <br />
                <span className="text-emerald-400">Zero hassle.</span>
              </h3>
              <p className="mt-5 text-lg leading-relaxed text-white/70">
                Join teams who switched to Give and never looked back.
                Connecting and accepting donations is completely free — no
                credit card, no trial, no catch.
              </p>
              <Link
                href="/signup"
                className="glow-btn mt-8 inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-7 py-4 font-semibold text-slate-900 shadow-xl"
              >
                Sign up free forever
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
