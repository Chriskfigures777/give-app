"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { ContactFormTypeform } from "./contact-form-typeform";

const FORM_IMAGE =
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=85";

export function LandingFormSection() {
  return (
    <section className="relative bg-slate-50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:grid md:grid-cols-2"
        >
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
          <div className="relative hidden aspect-[4/3] md:block md:aspect-auto md:min-h-[520px]">
            <Image
              src={FORM_IMAGE}
              alt="Team and community"
              fill
              className="object-cover"
              sizes="50vw"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <p className="text-sm font-medium uppercase tracking-wider text-white/90">
                Start in minutes
              </p>
              <p className="mt-1 text-xl font-bold sm:text-2xl">
                No credit card required. Get your first donation form live today.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12 md:py-16">
            <ContactFormTypeform variant="standalone" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
