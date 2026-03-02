"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=85";

export type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  image_url: string | null;
};

type Props = {
  members: TeamMember[];
  organizationName: string;
};

export function OrgTeamSection({ members, organizationName }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (members.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-white py-24 md:py-32">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-emerald-50/60 blur-[120px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-teal-50/50 blur-[100px] translate-y-1/3 -translate-x-1/4" />
        <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
      </div>

      {/* Grain */}
      <div className="org-noise absolute inset-0 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Our Team
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Meet the People Behind{" "}
            <span className="org-gradient-text">{organizationName}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500 leading-relaxed">
            Dedicated individuals working together to make a lasting impact.
          </p>
        </motion.div>

        {/* Team grid — modern portrait cards */}
        <div
          className={`grid gap-6 sm:gap-8 ${
            members.length === 1
              ? "max-w-sm mx-auto"
              : members.length === 2
              ? "max-w-2xl mx-auto grid-cols-1 sm:grid-cols-2"
              : members.length === 4
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="org-team-member group relative"
              onClick={() => setExpandedId(expandedId === member.id ? null : member.id)}
            >
              {/* Card with portrait image */}
              <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-emerald-900/10 group-hover:-translate-y-2">
                {/* Portrait image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={member.image_url || PLACEHOLDER_IMAGE}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Gradient overlay from bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Name + role overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">
                      {member.name}
                    </h3>
                    {member.role && (
                      <p className="mt-1 text-sm font-medium text-emerald-300 drop-shadow-md">
                        {member.role}
                      </p>
                    )}
                  </div>

                  {/* Hover glow ring */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ring-2 ring-inset ring-emerald-400/30 pointer-events-none" />
                </div>

                {/* Bio section below the image */}
                <AnimatePresence>
                  {member.bio && (
                    <motion.div
                      initial={false}
                      animate={{
                        height: expandedId === member.id ? "auto" : 0,
                        opacity: expandedId === member.id ? 1 : 0,
                      }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-6 py-5">
                        <p className="text-sm leading-relaxed text-slate-600">
                          {member.bio}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bio toggle hint */}
                {member.bio && (
                  <div className="flex items-center justify-center border-t border-slate-100 py-3">
                    <motion.span
                      animate={{ rotate: expandedId === member.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-slate-400 group-hover:text-emerald-500 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
