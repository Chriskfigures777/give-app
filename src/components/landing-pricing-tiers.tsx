"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Sparkles,
  Heart,
  Users,
  BarChart3,
  Code2,
  Globe,
  Repeat,
  Zap,
  MessageSquare,
  CalendarDays,
  Target,
  Link2,
  QrCode,
  FileText,
  Wallet,
  UserCheck,
  Clock,
  LayoutDashboard,
  Globe2,
  Split,
  UserPlus,
  Blocks,
  PenTool,
  Infinity,
  TrendingUp,
} from "lucide-react";

const FREE_FEATURES = [
  { icon: Heart, label: "Unlimited donations — no cap" },
  { icon: BarChart3, label: "Dashboard with real-time stats" },
  { icon: Code2, label: "Embedded forms & embed cards" },
  { icon: Link2, label: "Shareable donation links" },
  { icon: Globe, label: "Public organization page" },
  { icon: Users, label: "Peers — connect with other orgs" },
  { icon: MessageSquare, label: "Messaging with connected orgs" },
  { icon: CalendarDays, label: "Events — create & manage" },
  { icon: Target, label: "Goals & donation campaigns" },
  { icon: UserCheck, label: "Givers list & management" },
  { icon: PenTool, label: "Form customization — colors, images, amounts" },
  { icon: Repeat, label: "Recurring & one-time gifts" },
  { icon: QrCode, label: "QR codes for your give page" },
  { icon: Wallet, label: "Stripe Connect payouts & bank account" },
  { icon: FileText, label: "Year-end tax receipts" },
  { icon: Zap, label: "Feed, Explore & realtime donation feed" },
];

const FREE_TRIAL_FEATURES = [
  { icon: Clock, label: "14-day trial: Website builder" },
  { icon: Clock, label: "14-day trial: Split transactions" },
];

const WEBSITE_FEATURES = [
  { icon: LayoutDashboard, label: "Website builder (limited templates)" },
  { icon: Split, label: "Split transactions with peers" },
  { icon: Split, label: "Split transactions with missionaries" },
  { icon: Globe2, label: "Custom domains (yourdomain.org)" },
  { icon: UserPlus, label: "Add givers as missionaries" },
  { icon: Split, label: "Payment splits to connected orgs" },
];

const PRO_FEATURES = [
  { icon: LayoutDashboard, label: "Full website builder (all templates)" },
  { icon: Blocks, label: "Website CMS (edit pages, blocks)" },
  { icon: Infinity, label: "Unlimited website pages" },
  { icon: TrendingUp, label: "Advanced analytics" },
];

export function LandingPricingTiers() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/20 to-white py-28 md:py-36">
      {/* Decorative bg */}
      <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-100/30 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-4 py-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">
              Simple, transparent pricing
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Simple, <span className="text-emerald-600">transparent</span> pricing
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Free plan: unlimited donations, embeds, events, goals, givers,
            peers, messaging, form customization, and more — no credit card.
            Website ($35) and Pro ($49) include a 14-day free trial — no
            charge for two weeks.
          </p>
        </motion.div>

        {/* Tier cards */}
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {/* FREE TIER */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_2px_16px_rgba(0,0,0,0.04)] md:p-8"
          >
            <div className="mb-1 text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Free
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-slate-900">$0</span>
              <span className="text-lg text-slate-400">/month</span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
              Full-featured donation platform. Unlimited donations, embeds,
              events, goals, givers, peers, messaging, form customization.
              No credit card required.
            </p>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />

            <ul className="space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100">
                    <f.icon className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-700">
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2.5">
              {FREE_TRIAL_FEATURES.map((f) => (
                <li
                  key={f.label}
                  className="flex items-center gap-2.5 list-none"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100">
                    <f.icon className="h-3 w-3 text-amber-600" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-500 italic">
                    {f.label}
                  </span>
                </li>
              ))}
            </div>

            <Link
              href="/signup"
              className="glow-btn group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/20"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-2.5 text-center text-xs text-slate-400">
              No credit card required
            </p>

            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-emerald-100/40 blur-2xl" />
          </motion.div>

          {/* WEBSITE TIER */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative overflow-hidden rounded-3xl border-2 border-emerald-200 bg-white p-7 shadow-[0_4px_32px_rgba(16,185,129,0.10)] md:p-8"
          >
            {/* Popular badge */}
            <div className="absolute right-5 top-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <Check className="h-3 w-3" />
                Popular
              </span>
            </div>

            <div className="mb-1 text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Website
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-slate-900">$35</span>
              <span className="text-lg text-slate-400">/month</span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
              Everything in Free plus website builder and split transactions.
              14-day free trial — no charge for 14 days, then $35/mo.
            </p>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />

            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <Clock className="h-3 w-3" />
              14-day free trial — $0 for 14 days, then $35/mo
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Everything in Free, plus:
            </p>

            <ul className="space-y-2.5">
              {WEBSITE_FEATURES.map((f, i) => (
                <li key={`${f.label}-${i}`} className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100">
                    <f.icon className="h-3 w-3 text-violet-600" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-700">
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="glow-btn group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/20"
            >
              Start 14-day trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-2.5 text-center text-xs text-slate-400">
              No charge for 14 days
            </p>

            <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-emerald-100/40 blur-2xl" />
          </motion.div>

          {/* PRO TIER */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_2px_16px_rgba(0,0,0,0.04)] md:p-8"
          >
            <div className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Pro
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-slate-900">$49</span>
              <span className="text-lg text-slate-400">/month</span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
              Everything in Website plus full website builder, CMS, unlimited
              pages, advanced analytics. 14-day free trial — no charge for 14
              days, then $49/mo.
            </p>

            <div className="my-6 h-px bg-slate-100" />

            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <Clock className="h-3 w-3" />
              14-day free trial — $0 for 14 days, then $49/mo
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Everything in Website, plus:
            </p>

            <ul className="space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100">
                    <f.icon className="h-3 w-3 text-violet-600" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-700">
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="glow-btn group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              Start 14-day trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-2.5 text-center text-xs text-slate-400">
              No charge for 14 days
            </p>
          </motion.div>
        </div>

        {/* Bottom emphasis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-14 text-center"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-100 bg-emerald-50/50 px-8 py-6">
            <p className="text-[15px] font-medium text-slate-700">
              <span className="font-bold text-emerald-700">
                100% free to start.
              </span>{" "}
              Sign up, create your organization, accept unlimited donations,
              connect with peers, manage events and campaigns — all without
              paying a cent. Upgrade only when you need a website builder,
              custom domain, split transactions, or CMS.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
