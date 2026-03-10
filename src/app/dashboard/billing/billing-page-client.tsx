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
  UsersRound,
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
  trialDaysRemaining?: number | null;
};

const PLAN_DATA = [
  {
    id: "free" as OrgPlan,
    name: "Free Forever",
    price: "$0",
    period: "/month",
    description:
      "Full-featured donation platform. Unlimited donations, forms, embeds, QR codes, recurring giving, basic dashboard, tax receipts, theexchangeapp.church subdomain, up to 2 split recipients, connections & chat, Eventbrite integration, feed. No credit card required.",
    features: [
      "Unlimited donations — no cap",
      "Unlimited donation forms",
      "Embeddable forms & embed cards",
      "QR codes & donation links",
      "Recurring & one-time gifts",
      "Basic dashboard with real-time stats",
      "Year-end tax receipts",
      "theexchangeapp.church subdomain",
      "Up to 2 split recipients",
      "Connections & chat",
      "Eventbrite integration",
      "Feed & Explore",
      "Goals & campaigns",
      "Givers management",
      "Form customization",
      "Stripe Connect payouts",
    ],
    trial: null,
    cta: "Current plan",
    highlighted: false,
    upgradeKey: null,
  },
  {
    id: "growth" as OrgPlan,
    name: "Growth",
    price: "$29",
    period: "/month",
    description:
      "Everything in Free plus custom domain, website builder, up to 7 split recipients, and up to 3 missionaries you can add and pay out. 14-day free trial.",
    features: [
      { icon: Globe2, label: "Custom domain (yourdomain.org)" },
      { icon: LayoutDashboard, label: "Website builder + publishing" },
      { icon: Split, label: "Up to 7 split recipients" },
      { icon: UserPlus, label: "Add & pay up to 3 missionaries" },
      { icon: Split, label: "Split transactions with peers & missionaries" },
      { icon: UsersRound, label: "+$10/mo per team member" },
    ],
    trial: "14-day free trial",
    cta: "Start 14-day trial",
    highlighted: true,
    upgradeKey: "growth",
  },
  {
    id: "pro" as OrgPlan,
    name: "Pro",
    price: "$49",
    period: "/month",
    description:
      "Everything unlimited — splits, forms, recipients, missionaries, CMS (sermons, podcast, worship), advanced analytics, and unlimited pages. 14-day free trial.",
    features: [
      { icon: Infinity, label: "Everything unlimited — splits, forms, recipients" },
      { icon: Blocks, label: "CMS — sermons, podcast, worship" },
      { icon: TrendingUp, label: "Advanced analytics" },
      { icon: Infinity, label: "Unlimited website pages" },
      { icon: UserPlus, label: "Unlimited missionaries" },
      { icon: UsersRound, label: "+$10/mo per team member" },
    ],
    trial: "14-day free trial",
    cta: "Start 14-day trial",
    highlighted: false,
    upgradeKey: "pro",
  },
];

function PlanStatusBadge({
  plan,
  planStatus,
  isActive,
  trialDaysRemaining,
}: {
  plan: OrgPlan;
  planStatus: PlanStatus;
  isActive: boolean;
  trialDaysRemaining?: number | null;
}) {
  if (plan === "free") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-dashboard-card-hover px-3 py-1 text-xs font-semibold text-dashboard-text-muted">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }
  if (planStatus === "trialing") {
    const daysText =
      trialDaysRemaining != null
        ? trialDaysRemaining === 0
          ? "Trial ends today"
          : trialDaysRemaining === 1
            ? "1 day left"
            : `${trialDaysRemaining} days left`
        : "Trial active";
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
        <Clock className="h-3.5 w-3.5" />
        {daysText}
      </span>
    );
  }
  if (planStatus === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }
  if (planStatus === "past_due") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-900/30 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
        <AlertCircle className="h-3.5 w-3.5" />
        Past due
      </span>
    );
  }
  if (planStatus === "canceled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-dashboard-card-hover px-3 py-1 text-xs font-semibold text-dashboard-text-muted">
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
  trialDaysRemaining,
}: Props) {
  const [loading, setLoading] = useState<OrgPlan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  async function handleUpgrade(plan: "growth" | "pro") {
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
      ? "Free Forever"
      : currentPlan === "growth"
      ? "Growth ($29/mo)"
      : "Pro ($49/mo)";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-2 py-4 sm:px-4 sm:py-6">
      {/* Header */}
      <div className="dashboard-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text sm:text-3xl">
          Plan & Billing
        </h1>
        <p className="mt-1.5 text-sm text-dashboard-text-muted">
          Manage your platform subscription. Growth ($29) and Pro ($49) include a 14-day free trial. Team members: +$10/mo each.
        </p>
      </div>

      {/* Success banner */}
      {successPlan && !dismissed && (
        <div className="dashboard-fade-in relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-5">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-4 top-4 text-emerald-400 dark:text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-300"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                You&apos;re on the {successPlan === "growth" ? "Growth" : "Pro"} plan!
              </p>
              <p className="mt-0.5 text-sm text-emerald-600 dark:text-emerald-300">
                Your 14-day free trial has started.
                {trialDaysRemaining != null && trialDaysRemaining >= 0
                  ? ` You have ${trialDaysRemaining === 0 ? "today" : trialDaysRemaining === 1 ? "1 day" : `${trialDaysRemaining} days`} left in your trial.`
                  : " You won't be charged until the trial ends."}
                {" "}Access all{" "}
                {successPlan === "growth" ? "Growth" : "Pro"} features now.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Canceled banner */}
      {canceled && !dismissed && (
        <div className="dashboard-fade-in relative overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-5">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-4 top-4 text-amber-400 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-300"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Checkout was canceled. Your plan has not changed.
          </p>
        </div>
      )}

      {!hasOrg && (
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 text-center">
          <p className="text-dashboard-text-muted">
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
          <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm">
            <div className="relative border-b border-dashboard-border bg-dashboard-card-hover/30 px-6 py-5">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dashboard-accent/20">
                    <CreditCard className="h-5 w-5 text-dashboard-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-dashboard-text">
                      Current plan
                    </h2>
                    <p className="text-xs text-dashboard-text-muted">{planLabel}</p>
                  </div>
                </div>
                <PlanStatusBadge
                  plan={currentPlan}
                  planStatus={planStatus}
                  isActive={isActive}
                  trialDaysRemaining={trialDaysRemaining}
                />
              </div>
            </div>

            <div className="px-6 py-5">
              {currentPlan === "free" ? (
                <div className="space-y-3">
                  <p className="text-sm text-dashboard-text-muted">
                    You&apos;re on the Free Forever plan. Upgrade to Growth or Pro to unlock a custom
                    domain, website builder, more split recipients, missionaries, and more.
                  </p>
                  <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-300 w-fit">
                    <Sparkles className="h-3.5 w-3.5" />
                    14-day free trial on all paid plans — no charge for 2 weeks
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-dashboard-text-muted">
                    {planStatus === "trialing"
                      ? trialDaysRemaining != null
                        ? trialDaysRemaining === 0
                          ? "Your trial ends today. You'll be billed when it expires."
                          : trialDaysRemaining === 1
                            ? "1 day left in your trial. You won't be billed until the trial ends."
                            : `${trialDaysRemaining} days left in your trial. You won't be billed until the trial ends.`
                        : "Your trial is active. You won't be billed until the trial ends."
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
                      className="inline-flex items-center gap-2 rounded-xl bg-dashboard-text px-4 py-2.5 text-sm font-medium text-dashboard transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      {portalLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
        <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Pricing cards */}
      {hasOrg && (
        <section className="dashboard-fade-in">
          <h2 className="mb-5 text-lg font-semibold text-dashboard-text">
            {currentPlan === "free" ? "Choose a plan" : "Plans"}
          </h2>

          <div className="grid gap-5 lg:grid-cols-3">
            {PLAN_DATA.map((plan) => {
              const isCurrent =
                plan.id === currentPlan && (plan.id === "free" || isActive);
              const isUpgrade =
                plan.id !== "free" &&
                (currentPlan === "free" || (currentPlan === "growth" && plan.id === "pro"));

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                    isCurrent
                      ? "border-dashboard-accent bg-dashboard-accent/10 ring-2 ring-dashboard-accent/30"
                      : plan.highlighted
                      ? "border-dashboard-accent/50 bg-dashboard-card shadow-lg"
                      : "border-dashboard-border bg-dashboard-card"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-dashboard-accent px-4 py-0.5 text-xs font-bold text-white shadow">
                      Current plan
                    </span>
                  )}
                  {!isCurrent && plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-0.5 text-xs font-bold text-white shadow">
                      Popular
                    </span>
                  )}

                  <div className="mb-1 text-sm font-bold uppercase tracking-widest text-dashboard-accent">
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-dashboard-text">{plan.price}</span>
                    <span className="text-sm text-dashboard-text-muted">{plan.period}</span>
                  </div>

                  {plan.trial && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 w-fit">
                      <Clock className="h-3 w-3" />
                      {plan.trial} — $0 for 14 days
                    </div>
                  )}

                  <p className="mt-3 text-sm text-dashboard-text-muted">{plan.description}</p>

                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.features.map((f) =>
                      typeof f === "string" ? (
                        <li key={f} className="flex items-start gap-2 text-xs text-dashboard-text-muted">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dashboard-accent" />
                          {f}
                        </li>
                      ) : (
                        <li key={f.label} className="flex items-center gap-2 text-xs text-dashboard-text-muted">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-dashboard-accent/20">
                            <f.icon className="h-3 w-3 text-dashboard-accent" />
                          </div>
                          {f.label}
                        </li>
                      )
                    )}
                  </ul>

                  <div className="mt-6">
                    {isCurrent ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-dashboard-accent/20 py-2.5 text-sm font-semibold text-dashboard-accent">
                        <Check className="h-4 w-4" />
                        Current plan
                      </div>
                    ) : plan.id === "free" ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-dashboard-card-hover py-2.5 text-sm font-medium text-dashboard-text-muted">
                        Always free
                      </div>
                    ) : isUpgrade ? (
                      <button
                        type="button"
                        onClick={() => handleUpgrade(plan.id as "growth" | "pro")}
                        disabled={loading !== null}
                        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                          plan.highlighted
                            ? "bg-dashboard-accent text-white hover:opacity-90"
                            : "bg-dashboard-text text-dashboard hover:opacity-90"
                        }`}
                      >
                        {loading === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            {currentPlan !== "free" ? "Upgrading..." : "Redirecting..."}
                          </span>
                        ) : currentPlan !== "free" ? (
                          `Upgrade to ${plan.name}`
                        ) : (
                          plan.cta
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-dashboard-card-hover py-2.5 text-sm font-medium text-dashboard-text-muted">
                        Not available
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fee structure */}
          <div className="mt-6 rounded-2xl border border-dashboard-border bg-dashboard-card-hover/50 px-6 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">
              Transaction fees (all plans)
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-dashboard-text-muted">
              <span>Platform: 1%</span>
              <span>Stripe: 2.9% + $0.30</span>
              <span>Endowment: 0.3%</span>
            </div>
            <p className="mt-3 text-xs text-dashboard-text-muted">
              Growth ($29) and Pro ($49) plans: 14-day free trial. No charge for 14 days. Cancel
              anytime. Team members: +$10/mo each.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
