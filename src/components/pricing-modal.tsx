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
  "Donation dashboard with real-time stats",
  "Donation analytics & history",
  "Embedded donation forms — paste on any site",
  "Embed cards with multiple themes",
  "Donation links (shareable URLs)",
  "Public org page",
  "Peers — connect with other orgs",
  "Connection requests & approvals",
  "Messaging with connected orgs",
  "Events — create & manage",
  "Goals & donation campaigns",
  "Givers list & management",
  "Form customization — colors, amounts, images",
  "Suggested amounts & custom amounts",
  "Recurring gifts (monthly, etc.)",
  "One-time gifts",
  "Anonymous giving option",
  "Endowment fund selection",
  "QR codes for your give page",
  "Stripe Connect payouts",
  "Payout history & bank account",
  "Year-end tax receipts",
  "My gifts (giver history)",
  "Missionary embed (if you're a missionary)",
  "Feed & Explore",
  "Realtime donation feed",
  "14-day trial: Website builder",
  "14-day trial: Split transactions",
];

const WEBSITE_FEATURES = [
  "14-day free trial — $0 for 14 days, then $35/mo",
  "Everything in Free, plus:",
  "Website builder (limited templates)",
  "Split transactions with peers",
  "Split transactions with missionaries",
  "Custom domains (yourdomain.org)",
  "Add givers as missionaries",
  "Payment splits to connected orgs",
];

const PRO_FEATURES = [
  "14-day free trial — $0 for 14 days, then $49/mo",
  "Everything in Website, plus:",
  "Full website builder (all templates)",
  "Website CMS (edit pages, blocks)",
  "Unlimited website pages",
  "Advanced analytics",
];

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Full-featured donation platform. Unlimited donations, embeds, events, goals, givers, peers, messaging, form customization. 14-day trials for website builder and splits. No credit card required.",
    features: FREE_FEATURES,
    cta: "Get started free",
    href: "/signup",
    highlighted: false,
  },
  {
    id: "website",
    name: "Website",
    price: "$35",
    period: "/month",
    description: "Everything in Free plus website builder and split transactions. 14-day free trial — no charge for 14 days, then $35/mo.",
    features: WEBSITE_FEATURES,
    cta: "Start 14-day trial",
    href: "/signup",
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Everything in Website plus full website builder, CMS, unlimited pages, advanced analytics. 14-day free trial — no charge for 14 days, then $49/mo.",
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
            Free plan: unlimited donations, embeds, events, goals, givers, peers, messaging, form customization, and more — no credit card. Website ($35) and Pro ($49) include a 14-day free trial — no charge for two weeks.
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
            Website ($35) and Pro ($49) plans: 14-day free trial. No charge for 14 days. Cancel anytime before trial ends.
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
