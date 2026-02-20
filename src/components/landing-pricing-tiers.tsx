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
  LayoutDashboard,
  Globe2,
  Split,
  UserPlus,
  Blocks,
  PenTool,
  Infinity,
  TrendingUp,
  Rss,
  UsersRound,
} from "lucide-react";

const FREE_FEATURES = [
  { icon: Heart, label: "Unlimited donations — no cap" },
  { icon: Code2, label: "Unlimited donation forms" },
  { icon: Code2, label: "Embeddable forms & embed cards" },
  { icon: QrCode, label: "QR codes for your give page" },
  { icon: Link2, label: "Shareable donation links" },
  { icon: Repeat, label: "Recurring & one-time gifts" },
  { icon: BarChart3, label: "Basic dashboard with real-time stats" },
  { icon: FileText, label: "Year-end tax receipts" },
  { icon: Globe, label: "give.app subdomain" },
  { icon: Split, label: "Up to 2 split recipients" },
  { icon: Users, label: "Connections & chat with other orgs" },
  { icon: CalendarDays, label: "Eventbrite integration" },
  { icon: Rss, label: "Feed & Explore" },
  { icon: Target, label: "Goals & donation campaigns" },
  { icon: UserCheck, label: "Givers list & management" },
  { icon: PenTool, label: "Form customization — colors, images, amounts" },
  { icon: Wallet, label: "Stripe Connect payouts" },
];

const GROWTH_FEATURES = [
  { icon: Globe2, label: "Custom domain (yourdomain.org)" },
  { icon: LayoutDashboard, label: "Website builder + publishing" },
  { icon: Split, label: "Up to 7 split recipients" },
  { icon: UserPlus, label: "Add & pay up to 3 missionaries" },
  { icon: Split, label: "Split transactions with peers & missionaries" },
];

const PRO_FEATURES = [
  { icon: Infinity, label: "Unlimited splits, forms & recipients" },
  { icon: Blocks, label: "CMS — sermons, podcast, worship" },
  { icon: TrendingUp, label: "Advanced analytics" },
  { icon: Infinity, label: "Unlimited website pages" },
  { icon: UserPlus, label: "Unlimited missionaries" },
];

const ADDON_FEATURE = {
  icon: UsersRound,
  label: "+$10/mo per team member added to workspace",
};

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
            Free Forever plan: unlimited donations, forms, embeds, QR codes, and
            more — no credit card. Growth ($29) and Pro ($49) include a 14-day
            free trial. Revenue on 1% + Stripe.
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
              Free Forever
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-slate-900">$0</span>
              <span className="text-lg text-slate-400">/month</span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
              Full-featured donation platform. Unlimited donations, forms,
              embeds, QR codes, recurring giving, basic dashboard, tax receipts.
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

            <div className="mt-4">
              <li className="flex items-center gap-2.5 list-none">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100">
                  <ADDON_FEATURE.icon className="h-3 w-3 text-slate-500" />
                </div>
                <span className="text-[13px] font-medium text-slate-500">
                  {ADDON_FEATURE.label}
                </span>
              </li>
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

          {/* GROWTH TIER */}
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
              Growth
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-slate-900">$29</span>
              <span className="text-lg text-slate-400">/month</span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
              Everything in Free plus custom domain, website builder, up to 7
              split recipients, and up to 3 missionaries you can add and pay out.
              14-day free trial.
            </p>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />

            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Everything in Free, plus:
            </p>

            <ul className="space-y-2.5">
              {GROWTH_FEATURES.map((f, i) => (
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

            <div className="mt-4">
              <li className="flex items-center gap-2.5 list-none">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100">
                  <ADDON_FEATURE.icon className="h-3 w-3 text-slate-500" />
                </div>
                <span className="text-[13px] font-medium text-slate-500">
                  {ADDON_FEATURE.label}
                </span>
              </li>
            </div>

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
              Everything unlimited — splits, forms, recipients, missionaries,
              CMS (sermons, podcast, worship), advanced analytics, and
              unlimited pages. 14-day free trial.
            </p>

            <div className="my-6 h-px bg-slate-100" />

            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Everything in Growth, plus:
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

            <div className="mt-4">
              <li className="flex items-center gap-2.5 list-none">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100">
                  <ADDON_FEATURE.icon className="h-3 w-3 text-slate-500" />
                </div>
                <span className="text-[13px] font-medium text-slate-500">
                  {ADDON_FEATURE.label}
                </span>
              </li>
            </div>

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
              paying a cent. Upgrade only when you need a custom domain, website
              builder, more split recipients, or CMS. Add team members for
              $10/mo each.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
