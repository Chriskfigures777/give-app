"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  {
    title: "One dashboard, all your giving",
    description: "Track donations, givers, and campaigns in one place. No spreadsheets.",
    delay: 0,
    iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    title: "Embed anywhere",
    description: "Add a donation form to your site in minutes. Customize colors and fields.",
    delay: 0.1,
    iconPath: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.172-1.172a4 4 0 003.312-1.172M13.828 10.172L15 11.344m-1.172-.172l2.828-2.828a4 4 0 000-5.656l-4-4a4 4 0 00-5.656 0L4 6.344",
  },
  {
    title: "Secure & compliant",
    description: "Stripe-powered payments. Your givers' data stays safe.",
    delay: 0.2,
    iconPath: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
];

const SOCIAL_PROOF_IMAGE =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80";

const SECTION_IMAGE =
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=700&q=85";

export function LandingFeatures() {
  return (
    <section className="relative bg-gradient-to-b from-slate-50 to-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px", amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-xl lg:col-span-5"
          >
            <Image
              src={SECTION_IMAGE}
              alt="Team collaboration"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px", amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center lg:col-span-7 lg:text-left"
          >
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Built for ministries and nonprofits
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 lg:mx-0">
              From small churches to growing organizations—give your givers a
              seamless experience and your team a single source of truth.
            </p>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px", amount: 0.2 }}
              transition={{ duration: 0.5, delay: feature.delay }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.iconPath} />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Social proof block with real image */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="mt-24 overflow-hidden rounded-3xl bg-slate-900 shadow-2xl"
        >
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[320px]">
              <Image
                src={SOCIAL_PROOF_IMAGE}
                alt="Community coming together"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-col justify-center px-8 py-12 md:px-12">
              <p className="text-lg font-medium text-emerald-400">
                Trusted by organizations that give back
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                One platform. Every donation. Zero hassle.
              </h3>
              <p className="mt-4 text-white/80">
                Join teams who switched to Give and never looked back. Start
                accepting donations in minutes.
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex w-fit items-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-white/95"
              >
                Get started free
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
