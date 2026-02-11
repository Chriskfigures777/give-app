"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

const TEAM = [
  {
    name: "Alex Morgan",
    role: "Head of Product",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=85",
    bio: "Alex drives product strategy and design. She works closely with churches and nonprofits to build features that solve real problems and scale with their growth.",
  },
  {
    name: "Jordan Lee",
    role: "Engineering Lead",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=85",
    bio: "Jordan leads our engineering team and keeps Give fast, secure, and reliable. He’s passionate about clean APIs and making complex systems simple for users.",
  },
];

export function TeamSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Our team
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            The team behind Give
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            A small team focused on one thing: making giving simple, transparent, and impactful for families and organizations.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-lg">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                  <p className="text-sm font-medium text-emerald-600">{member.role}</p>
                </div>
              </div>

              <AnimatePresence>
                {hovered === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.97 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-0 left-0 right-0 z-10 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-xl backdrop-blur-sm"
                  >
                    <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                    <p className="text-sm font-medium text-emerald-600">{member.role}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {member.bio}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
