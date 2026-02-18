"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { ContactFormTypeform } from "./contact-form-typeform";
import { usePricingModal } from "@/lib/use-pricing-modal";

const FORM_IMAGE =
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=85";

export function LandingFormSection() {
  const { openPricingModal } = usePricingModal();
  return (
    <section className="relative bg-slate-50 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/60 md:grid md:grid-cols-2"
        >
          {/* Mobile image */}
          <div className="relative aspect-[3/2] md:hidden">
            <Image
              src={FORM_IMAGE}
              alt="Team and community"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
          </div>

          {/* Desktop image */}
          <div className="relative hidden md:block md:min-h-[560px]">
            <Image
              src={FORM_IMAGE}
              alt="Team and community"
              fill
              className="object-cover"
              sizes="50vw"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                <span className="flex h-2 w-2">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-white/90">Accepting new organizations</span>
              </div>
              <p className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                No credit card required.
                <br />
                Get your first donation form live today.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col justify-center px-8 py-14 sm:px-12 md:py-16">
            <ContactFormTypeform variant="standalone" />
            <p className="mt-4 text-center text-sm text-slate-500">
              <button
                type="button"
                onClick={openPricingModal}
                className="font-medium text-emerald-600 hover:text-emerald-700"
              >
                See pricing
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
