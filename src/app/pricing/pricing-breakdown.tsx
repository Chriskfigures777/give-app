"use client";

import { motion } from "motion/react";
import {
  calculateChargeAmountCents,
  STRIPE_FEE_RATE,
  STRIPE_FEE_FIXED_CENTS,
  PLATFORM_FEE_RATE,
  type FeeCoverage,
} from "@/lib/fee-calculator";
import { ENDOWMENT_SHARE_OF_PLATFORM_FEE } from "@/lib/stripe/constants";
import { Check } from "lucide-react";

const EXAMPLE_DONATION_CENTS = 10000;

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function orgReceivesCents(
  donationCents: number,
  feeCoverage: FeeCoverage
): number {
  if (feeCoverage === "org_pays") {
    const charge = donationCents;
    const stripeFee =
      Math.ceil(charge * STRIPE_FEE_RATE) + STRIPE_FEE_FIXED_CENTS;
    const platformFee = Math.ceil(charge * PLATFORM_FEE_RATE);
    return charge - stripeFee - platformFee;
  }
  return donationCents;
}

export function PricingBreakdown() {
  const donorBothCharge = calculateChargeAmountCents(
    EXAMPLE_DONATION_CENTS,
    "donor_both"
  );
  const orgPaidReceives = orgReceivesCents(
    EXAMPLE_DONATION_CENTS,
    "org_pays"
  );
  const endowmentPercent = (
    PLATFORM_FEE_RATE *
    ENDOWMENT_SHARE_OF_PLATFORM_FEE *
    100
  ).toFixed(1);

  const freeFeatures = [
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

  const websiteFeatures = [
    "14-day free trial — $0 for 14 days, then $35/mo",
    "Everything in Free, plus:",
    "Website builder (limited templates)",
    "Split transactions with peers",
    "Split transactions with missionaries",
    "Custom domains (yourdomain.org)",
    "Add givers as missionaries",
    "Payment splits to connected orgs",
  ];

  const proFeatures = [
    "14-day free trial — $0 for 14 days, then $49/mo",
    "Everything in Website, plus:",
    "Full website builder (all templates)",
    "Website CMS (edit pages, blocks)",
    "Unlimited website pages",
    "Advanced analytics",
  ];

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Full-featured donation platform. Unlimited donations, embeds, events, goals, givers, peers, messaging, form customization. 14-day trials for website builder and splits. No credit card required.",
      features: freeFeatures,
    },
    {
      id: "website",
      name: "Website",
      price: "$35",
      period: "/month",
      description: "Everything in Free plus website builder and split transactions. 14-day free trial — no charge for 14 days, then $35/mo.",
      features: websiteFeatures,
      highlighted: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$49",
      period: "/month",
      description: "Everything in Website plus full website builder, CMS, unlimited pages, advanced analytics. 14-day free trial — no charge for 14 days, then $49/mo.",
      features: proFeatures,
    },
  ];

  return (
    <section className="relative bg-slate-50/50 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        {/* Plans section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Plans
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Choose the right plan for you
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg text-slate-600">
            Free plan: unlimited donations, embeds, events, goals, givers, peers, messaging, form customization, and more — no credit card. Website ($35) and Pro ($49) include a 14-day free trial — no charge for two weeks.
          </p>
        </motion.div>

        <div className="mb-24 grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                (plan as { highlighted?: boolean }).highlighted
                  ? "border-emerald-500/50 bg-white shadow-lg ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-white"
              }`}
            >
              {(plan as { highlighted?: boolean }).highlighted && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-1 flex items-baseline gap-0.5">
                <span className="text-2xl font-extrabold text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
              <ul className="mt-4 flex-1 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Transparent pricing
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            See exactly where every dollar goes
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            No hidden fees. No monthly charges. Fees apply only when a donation
            is processed.
          </p>
        </motion.div>

        {/* Fee structure card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-20 max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-5">
            <h3 className="text-lg font-bold text-white">Fee structure</h3>
            <p className="mt-1 text-sm text-white/80">
              Simple fees. No surprises.
            </p>
          </div>
          <div className="divide-y divide-slate-100 px-8">
            {[
              {
                label: "Platform fee",
                value: "1%",
                detail: "Supports the Give platform",
              },
              {
                label: "Stripe processing",
                value: "2.9% + $0.30",
                detail: "Industry-standard card processing",
              },
              {
                label: "Endowment allocation",
                value: `${endowmentPercent}%`,
                detail: "30% of platform fee to global impact",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-5"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {row.label}
                  </span>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {row.detail}
                  </p>
                </div>
                <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 px-8 py-5">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                No setup fees
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                No monthly plans
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                Cancel anytime
              </div>
            </div>
          </div>
        </motion.div>

        {/* Example cards */}
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="landing-card overflow-hidden"
          >
            <div className="bg-slate-900 px-8 py-5">
              <h3 className="text-lg font-bold text-white">
                Organization pays fees
              </h3>
            </div>
            <div className="p-8">
              <p className="text-slate-600">
                For a <strong>$100</strong> donation, the giver pays $100. Your
                organization receives the amount after fees.
              </p>
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Giver pays</span>
                  <span className="font-semibold text-slate-900">
                    ${formatCents(EXAMPLE_DONATION_CENTS)}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-600">
                    Your organization receives
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    ${formatCents(orgPaidReceives)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="gradient-border overflow-hidden"
          >
            <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-5">
              <h3 className="text-lg font-bold text-white">
                Giver covers fees
              </h3>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                Recommended
              </span>
            </div>
            <div className="p-8">
              <p className="text-slate-600">
                Givers can choose to cover all fees. Your organization
                receives the <strong>full donation amount</strong>.
              </p>
              <div className="mt-6 rounded-2xl bg-emerald-50/50 p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Giver pays</span>
                  <span className="font-semibold text-slate-900">
                    ${formatCents(donorBothCharge)}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-600">
                    Your organization receives
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    ${formatCents(EXAMPLE_DONATION_CENTS)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center text-sm text-slate-500"
        >
          Givers can optionally allocate a portion of the platform fee to an
          endowment fund. This is completely transparent and chosen at the
          time of donation.
        </motion.p>
      </div>
    </section>
  );
}
