"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { PLATFORM_FEE_RATE } from "@/lib/fee-calculator";
import { ENDOWMENT_SHARE_OF_PLATFORM_FEE } from "@/lib/stripe/constants";

const endowmentPercent = (
  PLATFORM_FEE_RATE *
  ENDOWMENT_SHARE_OF_PLATFORM_FEE *
  100
).toFixed(1);

const FREE_FEATURES = [
  "Unlimited donations — no cap",
  "Unlimited donation forms",
  "Embeddable forms & embed cards",
  "QR codes for your give page",
  "Shareable donation links",
  "Recurring & one-time gifts",
  "Basic dashboard with real-time stats",
  "Donation analytics & history",
  "Year-end tax receipts",
  "give.app subdomain",
  "Up to 2 split recipients",
  "Connections & chat with other orgs",
  "Eventbrite integration",
  "Feed & Explore",
  "Goals & donation campaigns",
  "Givers list & management",
  "Form customization — colors, amounts, images",
  "Stripe Connect payouts & bank account",
  "Missionary embed (if you're a missionary)",
  "Realtime donation feed",
];

const GROWTH_FEATURES = [
  "14-day free trial — $0 for 14 days, then $29/mo",
  "Everything in Free, plus:",
  "Custom domain (yourdomain.org)",
  "Website builder + publishing",
  "Up to 7 split recipients",
  "Add & pay up to 3 missionaries",
  "Split transactions with peers & missionaries",
  "+$10/mo per team member added to workspace",
];

const PRO_FEATURES = [
  "14-day free trial — $0 for 14 days, then $49/mo",
  "Everything in Growth, plus:",
  "Everything unlimited — splits, forms, recipients",
  "CMS — sermons, podcast, worship",
  "Advanced analytics",
  "Unlimited website pages",
  "Unlimited missionaries",
  "+$10/mo per team member added to workspace",
];

const PLANS = [
  {
    id: "free",
    name: "Free Forever",
    price: "$0",
    period: "/month",
    description: "Full-featured donation platform. Unlimited donations, forms, embeds, QR codes, recurring giving, basic dashboard, tax receipts, give.app subdomain, up to 2 split recipients, connections & chat, Eventbrite integration, feed. No credit card required.",
    features: FREE_FEATURES,
    cta: "Get started free",
    href: "/signup",
    highlighted: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$29",
    period: "/month",
    description: "Everything in Free plus custom domain, website builder, up to 7 split recipients, and up to 3 missionaries you can add and pay out. 14-day free trial.",
    features: GROWTH_FEATURES,
    cta: "Start 14-day trial",
    href: "/signup",
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Everything unlimited — splits, forms, recipients, missionaries, CMS (sermons, podcast, worship), advanced analytics, and unlimited pages. 14-day free trial.",
    features: PRO_FEATURES,
    cta: "Start 14-day trial",
    href: "/signup",
    highlighted: false,
  },
];

type PricingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Simple, transparent pricing
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-600">
            Free Forever plan: unlimited donations, forms, embeds, QR codes, and
            more — no credit card. Growth ($29) and Pro ($49) include a 14-day
            free trial. Add team members for $10/mo each.
          </p>
        </DialogHeader>

        <div className="grid gap-6 px-6 pb-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-5 min-h-0 ${
                plan.highlighted
                  ? "border-emerald-500/50 bg-emerald-50/30 shadow-lg"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
                  Popular
                </span>
              )}
              <div className="mb-3 shrink-0">
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
              </div>
              <p className="mb-4 text-sm text-slate-600 shrink-0">{plan.description}</p>
              <ul className="mb-6 flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 max-h-[280px]">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
                onClick={() => onOpenChange(false)}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Fee structure summary */}
        <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Transaction fees (all plans)
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span>Platform: 1%</span>
            <span>Stripe: 2.9% + $0.30</span>
            <span>Endowment: {endowmentPercent}%</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Growth ($29) and Pro ($49) plans: 14-day free trial. No charge for 14 days. Cancel anytime. Team members: +$10/mo each.
          </p>
        </div>

        <div className="px-6 pb-6 text-center">
          <Link
            href="/pricing"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            onClick={() => onOpenChange(false)}
          >
            View full pricing
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
