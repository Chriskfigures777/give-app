"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { Linkedin, Twitter } from "lucide-react";

const TEAM = [
  {
    name: "Alex Morgan",
    role: "Head of Product",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=85",
    bio: "Alex drives product strategy and design. She works closely with churches and nonprofits to build features that solve real problems.",
  },
  {
    name: "Jordan Lee",
    role: "Engineering Lead",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=85",
    bio: "Jordan leads our engineering team and keeps Give fast, secure, and reliable. He's passionate about clean APIs and simplicity.",
  },
];

export function TeamSection() {
  return (
    <section className="relative bg-slate-50/50 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Our team
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            The people behind Give
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            A small team focused on one thing: making giving simple, transparent,
            and impactful for families and organizations.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.1,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group"
            >
              <div className="landing-card overflow-hidden">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Hover overlay with bio */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-full p-6 transition-transform duration-500 ease-out group-hover:translate-y-0">
                    <p className="text-sm leading-relaxed text-white/90">
                      {member.bio}
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30">
                        <Twitter className="h-4 w-4" />
                      </button>
                      <button className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30">
                        <Linkedin className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-emerald-600">
                    {member.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
