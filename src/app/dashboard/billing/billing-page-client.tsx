"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  CreditCard,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  LayoutDashboard,
  Split,
  Globe2,
  UserPlus,
  Blocks,
  Infinity,
  TrendingUp,
  X,
} from "lucide-react";
import type { OrgPlan, PlanStatus } from "@/lib/plan";

type Props = {
  currentPlan: OrgPlan;
  planStatus: PlanStatus;
  isActive: boolean;
  hasSubscription: boolean;
  hasOrg: boolean;
  successPlan?: OrgPlan;
  canceled?: boolean;
};

const PLAN_DATA = [
  {
    id: "free" as OrgPlan,
    name: "Free",
    price: "$0",
    period: "/month",
    description:
      "Full-featured donation platform. Unlimited donations, embeds, events, goals, givers, peers, messaging, form customization. No credit card required.",
    features: [
      "Unlimited donations — no cap",
      "Dashboard with real-time stats",
      "Embedded donation forms",
      "Donation links (shareable URLs)",
      "Up to 3 donation forms",
      "Public organization page",
      "Peers & messaging",
      "Events, goals, givers management",
      "Form customization",
      "Recurring & one-time gifts",
      "QR codes, tax receipts",
      "Stripe Connect payouts",
      "Feed & Explore",
    ],
    trial: null,
    cta: "Current plan",
    highlighted: false,
    upgradeKey: null,
  },
  {
    id: "website" as OrgPlan,
    name: "Website",
    price: "$35",
    period: "/month",
    description:
      "Everything in Free plus website builder and split transactions. 14-day free trial — no charge for 14 days, then $35/mo.",
    features: [
      { icon: LayoutDashboard, label: "Website builder (limited templates)" },
      { icon: Split, label: "Up to 10 donation forms" },
      { icon: Split, label: "Split transactions with peers" },
      { icon: Split, label: "Split transactions with missionaries" },
      { icon: Globe2, label: "Custom domains (yourdomain.org)" },
      { icon: UserPlus, label: "Add givers as missionaries" },
      { icon: Split, label: "Payment splits to connected orgs" },
    ],
    trial: "14-day free trial",
    cta: "Start 14-day trial",
    highlighted: true,
    upgradeKey: "website",
  },
  {
    id: "pro" as OrgPlan,
    name: "Pro",
    price: "$49",
    period: "/month",
    description:
      "Everything in Website plus full website builder, CMS, unlimited pages, advanced analytics. 14-day free trial.",
    features: [
      { icon: LayoutDashboard, label: "Full website builder (all templates)" },
      { icon: Infinity, label: "Unlimited donation forms" },
      { icon: Blocks, label: "Website CMS (edit pages, blocks)" },
      { icon: Infinity, label: "Unlimited website pages" },
      { icon: TrendingUp, label: "Advanced analytics" },
    ],
    trial: "14-day free trial",
    cta: "Start 14-day trial",
    highlighted: false,
    upgradeKey: "pro",
  },
];

function PlanStatusBadge({ plan, planStatus, isActive }: { plan: OrgPlan; planStatus: PlanStatus; isActive: boolean }) {
  if (plan === "free") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }
  if (planStatus === "trialing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        <Clock className="h-3.5 w-3.5" />
        Trial active
      </span>
    );
  }
  if (planStatus === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }
  if (planStatus === "past_due") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        <AlertCircle className="h-3.5 w-3.5" />
        Past due
      </span>
    );
  }
  if (planStatus === "canceled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
        <XCircle className="h-3.5 w-3.5" />
        Canceled
      </span>
    );
  }
  return null;
}

export function BillingPageClient({
  currentPlan,
  planStatus,
  isActive,
  hasSubscription,
  hasOrg,
  successPlan,
  canceled,
}: Props) {
  const [loading, setLoading] = useState<OrgPlan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  async function handleUpgrade(plan: "website" | "pro") {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to open billing portal");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPortalLoading(false);
    }
  }

  const planLabel =
    currentPlan === "free"
      ? "Free"
      : currentPlan === "website"
      ? "Website ($35/mo)"
      : "Pro ($49/mo)";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-2 py-4 sm:px-4 sm:py-6">
      {/* Header */}
      <div className="dashboard-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Plan & Billing
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Manage your platform subscription. Website ($35) and Pro ($49) include a 14-day free trial.
        </p>
      </div>

      {/* Success banner */}
      {successPlan && !dismissed && (
        <div className="dashboard-fade-in relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-4 top-4 text-emerald-400 hover:text-emerald-600"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-semibold text-emerald-800">
                You&apos;re on the {successPlan === "website" ? "Website" : "Pro"} plan!
              </p>
              <p className="mt-0.5 text-sm text-emerald-600">
                Your 14-day free trial has started. You won&apos;t be charged until the trial ends.
                Access all{" "}
                {successPlan === "website" ? "Website" : "Pro"} features now.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Canceled banner */}
      {canceled && !dismissed && (
        <div className="dashboard-fade-in relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-4 top-4 text-amber-400 hover:text-amber-600"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm font-medium text-amber-800">
            Checkout was canceled. Your plan has not changed.
          </p>
        </div>
      )}

      {!hasOrg && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-slate-600">
            You need to create an organization before subscribing to a plan.
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Go to dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Current plan card */}
      {hasOrg && (
        <section className="dashboard-fade-in">
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-700/60 dark:bg-slate-800/50">
            <div className="relative border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/40 px-6 py-5 dark:border-slate-700/50 dark:from-emerald-900/10 dark:via-slate-800/50 dark:to-teal-900/10">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Current plan
                    </h2>
                    <p className="text-xs text-slate-500">{planLabel}</p>
                  </div>
                </div>
                <PlanStatusBadge plan={currentPlan} planStatus={planStatus} isActive={isActive} />
              </div>
            </div>

            <div className="px-6 py-5">
              {currentPlan === "free" ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    You&apos;re on the free plan. Upgrade to Website or Pro to unlock the website
                    builder, split transactions, custom domains, and more.
                  </p>
                  <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 w-fit">
                    <Sparkles className="h-3.5 w-3.5" />
                    14-day free trial on all paid plans — no charge for 2 weeks
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {planStatus === "trialing"
                      ? "Your trial is active. You won't be billed until the trial ends."
                      : planStatus === "past_due"
                      ? "Your payment is past due. Update your payment method to keep access."
                      : planStatus === "canceled"
                      ? "Your subscription has been canceled. You still have access until the end of the billing period."
                      : "Your subscription is active."}
                  </p>
                  {hasSubscription && (
                    <button
                      type="button"
                      onClick={handlePortal}
                      disabled={portalLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
                    >
                      {portalLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-slate-900" />
                      ) : (
                        <CreditCard className="h-3.5 w-3.5" />
                      )}
                      Manage subscription
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Pricing cards */}
      {hasOrg && (
        <section className="dashboard-fade-in">
          <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {currentPlan === "free" ? "Choose a plan" : "Plans"}
          </h2>

          <div className="grid gap-5 lg:grid-cols-3">
            {PLAN_DATA.map((plan) => {
              const isCurrent =
                plan.id === currentPlan && (plan.id === "free" || isActive);
              const isUpgrade =
                plan.id !== "free" &&
                (currentPlan === "free" || (currentPlan === "website" && plan.id === "pro"));

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                    isCurrent
                      ? "border-emerald-400 bg-emerald-50/30 ring-2 ring-emerald-200"
                      : plan.highlighted
                      ? "border-emerald-200 bg-white shadow-lg shadow-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-0.5 text-xs font-bold text-white shadow">
                      Current plan
                    </span>
                  )}
                  {!isCurrent && plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-0.5 text-xs font-bold text-white shadow">
                      Popular
                    </span>
                  )}

                  <div className="mb-1 text-sm font-bold uppercase tracking-widest text-emerald-600">
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-400">{plan.period}</span>
                  </div>

                  {plan.trial && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 w-fit">
                      <Clock className="h-3 w-3" />
                      {plan.trial} — $0 for 14 days
                    </div>
                  )}

                  <p className="mt-3 text-sm text-slate-600">{plan.description}</p>

                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.features.map((f) =>
                      typeof f === "string" ? (
                        <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {f}
                        </li>
                      ) : (
                        <li key={f.label} className="flex items-center gap-2 text-xs text-slate-600">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-100">
                            <f.icon className="h-3 w-3 text-emerald-600" />
                          </div>
                          {f.label}
                        </li>
                      )
                    )}
                  </ul>

                  <div className="mt-6">
                    {isCurrent ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700">
                        <Check className="h-4 w-4" />
                        Current plan
                      </div>
                    ) : plan.id === "free" ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-medium text-slate-500">
                        Always free
                      </div>
                    ) : isUpgrade ? (
                      <button
                        type="button"
                        onClick={() => handleUpgrade(plan.id as "website" | "pro")}
                        disabled={loading !== null}
                        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                          plan.highlighted
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        {loading === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {currentPlan !== "free" ? "Upgrading..." : "Redirecting..."}
                          </span>
                        ) : currentPlan !== "free" ? (
                          `Upgrade to ${plan.name}`
                        ) : (
                          plan.cta
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-medium text-slate-400">
                        Not available
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fee structure */}
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Transaction fees (all plans)
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span>Platform: 1%</span>
              <span>Stripe: 2.9% + $0.30</span>
              <span>Endowment: 0.3%</span>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Website ($35) and Pro ($49) plans: 14-day free trial. No charge for 14 days. Cancel
              anytime before trial ends.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
