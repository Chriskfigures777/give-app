"use client";

import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { useRef } from "react";
import Link from "next/link";
import {
  Users,
  Handshake,
  ArrowRight,
  AlertTriangle,
  Code2,
  ChurchIcon,
  Landmark,
} from "lucide-react";

const PAIN_POINTS = [
  {
    id: "government-funding",
    icon: Landmark,
    iconGradient: "from-amber-500 to-orange-600",
    question: "Still relying solely on government funding?",
    headline: "Government grants dry up. Your mission shouldn't.",
    description:
      "Many churches and faith-based nonprofits depend on government funding that can be cut, delayed, or come with strings attached. Give empowers your congregation to fund your ministry directly—building a sustainable, independent revenue stream that keeps your doors open and your programs running.",
    stat: "72%",
    statLabel: "of churches report funding uncertainty year-over-year",
    accent: "amber",
  },
  {
    id: "missionary-payments",
    icon: Users,
    iconGradient: "from-violet-500 to-purple-600",
    question: "Paying missionaries manually every month?",
    headline: "Automate missionary support with a few clicks.",
    description:
      "When a congregation member tithes, a portion can automatically be routed to your missionaries—no spreadsheets, no extra bank transfers, no delays. Set the split once, and Give handles the rest. Your missionaries get paid on time, every time, directly from tithes and offerings.",
    stat: "3 min",
    statLabel: "average setup time for automated missionary splits",
    accent: "violet",
  },
  {
    id: "nonprofit-connectivity",
    icon: Handshake,
    iconGradient: "from-cyan-500 to-blue-600",
    question: "Isolated from other nonprofits in your community?",
    headline: "Connect with nonprofits. Multiply your impact.",
    description:
      "Post your Give donation form on partner websites and let other nonprofits share theirs on yours. Every donation flows seamlessly through the platform. Build a network of faith-based organizations in your city and discover where your missions overlap for greater community impact.",
    stat: "5x",
    statLabel: "average reach increase through nonprofit partnerships",
    accent: "cyan",
  },
  {
    id: "donation-forms",
    icon: Code2,
    iconGradient: "from-emerald-500 to-teal-600",
    question: "Still collecting donations with paper envelopes?",
    headline: "A beautiful donation form on your website in minutes.",
    description:
      "Embed a fully branded, mobile-friendly donation form on your church website with a single line of code. Accept one-time or recurring gifts, send automatic receipts, and track everything from your dashboard. Your congregation can give from anywhere—even during the sermon.",
    stat: "40%",
    statLabel: "average increase in giving after going digital",
    accent: "emerald",
  },
];

function PainPointCard({
  point,
  index,
}: {
  point: (typeof PAIN_POINTS)[number];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), {
    stiffness: 200,
    damping: 20,
  });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const accentColors: Record<string, { bg: string; text: string; textDark: string; border: string; glow: string; badge: string; badgeText: string; statBg: string }> = {
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      textDark: "text-amber-700",
      border: "border-amber-200/60",
      glow: "rgba(245, 158, 11, 0.08)",
      badge: "bg-amber-50 border-amber-200/60",
      badgeText: "text-amber-700",
      statBg: "bg-amber-50",
    },
    violet: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      textDark: "text-violet-700",
      border: "border-violet-200/60",
      glow: "rgba(139, 92, 246, 0.08)",
      badge: "bg-violet-50 border-violet-200/60",
      badgeText: "text-violet-700",
      statBg: "bg-violet-50",
    },
    cyan: {
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      textDark: "text-cyan-700",
      border: "border-cyan-200/60",
      glow: "rgba(6, 182, 212, 0.08)",
      badge: "bg-cyan-50 border-cyan-200/60",
      badgeText: "text-cyan-700",
      statBg: "bg-cyan-50",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      textDark: "text-emerald-700",
      border: "border-emerald-200/60",
      glow: "rgba(16, 185, 129, 0.08)",
      badge: "bg-emerald-50 border-emerald-200/60",
      badgeText: "text-emerald-700",
      statBg: "bg-emerald-50",
    },
  };

  const colors = accentColors[point.accent];
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className="group"
    >
      <div
        className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-20 ${
          !isEven ? "lg:grid-flow-dense" : ""
        }`}
      >
        {/* Text content */}
        <div className={!isEven ? "lg:col-start-2" : ""}>
          <motion.div
            initial={{ opacity: 0, x: isEven ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Pain point question badge */}
            <div className={`mb-5 inline-flex items-center gap-2 rounded-full border ${colors.badge} px-4 py-2`}>
              <AlertTriangle className={`h-3.5 w-3.5 ${colors.text}`} />
              <span className={`text-sm font-medium ${colors.badgeText}`}>
                {point.question}
              </span>
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {point.headline}
            </h3>

            <p className="mt-5 text-[16px] leading-relaxed text-slate-600">
              {point.description}
            </p>

            {/* Stat callout */}
            <div className="mt-8 flex items-center gap-5">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colors.statBg} border ${colors.border}`}
              >
                <span className={`text-2xl font-extrabold ${colors.textDark}`}>
                  {point.stat}
                </span>
              </div>
              <p className="text-sm leading-snug text-slate-500">
                {point.statLabel}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Visual card */}
        <div className={!isEven ? "lg:col-start-1 lg:row-start-1" : ""}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 transition-all duration-500 hover:border-slate-300 hover:shadow-xl"
            style={{ boxShadow: `0 4px 32px ${colors.glow}, 0 1px 3px rgba(0,0,0,0.04)` }}
          >
            {/* Icon */}
            <div
              className={`mb-6 inline-flex rounded-2xl bg-gradient-to-br ${point.iconGradient} p-4 shadow-lg`}
            >
              <point.icon className="h-7 w-7 text-white" strokeWidth={1.8} />
            </div>

            {/* Mini illustration lines */}
            <div className="space-y-3">
              {[85, 60, 75, 45].map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="origin-left"
                >
                  <div
                    className={`h-3 rounded-full ${i === 0 ? `bg-gradient-to-r ${point.iconGradient} opacity-70` : "bg-slate-100"}`}
                    style={{ width: `${w}%` }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Mock dashboard element */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[1, 2, 3].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <div className={`h-8 w-8 rounded-lg ${colors.bg} mb-2`} />
                  <div className="h-2 w-full rounded-full bg-slate-200/70" />
                  <div className="mt-1 h-2 w-2/3 rounded-full bg-slate-100" />
                </motion.div>
              ))}
            </div>

            {/* Decorative gradient orb */}
            <div
              className={`absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${point.iconGradient} opacity-[0.06] blur-3xl transition-all duration-700 group-hover:opacity-[0.12] group-hover:scale-150`}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function LandingPainPoints() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/30 to-white py-28 md:py-40">
      {/* Light decorative background shapes */}
      <div className="absolute -left-48 top-1/4 h-[500px] w-[500px] rounded-full bg-emerald-100/40 blur-[100px]" />
      <div className="absolute -right-32 top-2/3 h-[400px] w-[400px] rounded-full bg-violet-100/30 blur-[100px]" />
      <div className="absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-100/20 blur-[80px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-4 py-2">
            <ChurchIcon className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Built for churches & faith-based nonprofits
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl">
            We understand your
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              real challenges
            </span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Running a church means wearing a hundred hats. Funding shouldn&apos;t
            be the thing that keeps you up at night. Here are the pain points
            we&apos;re solving—so you can focus on your calling.
          </p>
        </motion.div>

        {/* Pain point cards */}
        <div className="mt-24 space-y-28">
          {PAIN_POINTS.map((point, i) => (
            <PainPointCard key={point.id} point={point} index={i} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-28 text-center"
        >
          <p className="mb-6 text-lg text-slate-500">
            See how real churches could transform their giving
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/case-studies"
              className="glow-btn group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20"
            >
              View case studies
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/signup"
              className="glow-btn inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              Sign up free — no credit card
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
