"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, ArrowRight, Sparkles, Clock, Check } from "lucide-react";
import type { OrgPlan } from "@/lib/plan";

type PaywallGateProps = {
  /** The minimum plan required to access this feature. */
  requiredPlan: "website" | "pro";
  /** Display name of the locked feature. */
  featureName: string;
  /** Brief description shown on the gate. */
  featureDescription?: string;
  /** Current org plan (used to determine upgrade path). */
  currentPlan?: OrgPlan;
};

const PLAN_CARDS = {
  website: {
    name: "Website",
    price: "$35",
    period: "/month",
    trial: "14-day free trial",
    description: "Everything in Free plus website builder, split transactions, and custom domains.",
    features: [
      "Website builder (limited templates)",
      "Up to 10 donation forms",
      "Split transactions with peers",
      "Split transactions with missionaries",
      "Custom domains (yourdomain.org)",
      "Add givers as missionaries",
      "Payment splits to connected orgs",
    ],
    cta: "Start 14-day trial",
    highlighted: true,
  },
  pro: {
    name: "Pro",
    price: "$49",
    period: "/month",
    trial: "14-day free trial",
    description: "Everything in Website plus full builder, CMS, unlimited pages, advanced analytics.",
    features: [
      "Full website builder (all templates)",
      "Unlimited donation forms",
      "Website CMS (edit pages, blocks)",
      "Unlimited website pages",
      "Advanced analytics",
    ],
    cta: "Start 14-day trial",
    highlighted: false,
  },
};

function PlanCard({ plan, onUpgrade }: { plan: "website" | "pro"; onUpgrade: (plan: "website" | "pro") => void }) {
  const meta = PLAN_CARDS[plan];
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        meta.highlighted
          ? "border-emerald-400 bg-emerald-50/40 shadow-lg shadow-emerald-100"
          : "border-slate-200 bg-white"
      }`}
    >
      {meta.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-0.5 text-xs font-bold text-white shadow">
          Popular
        </span>
      )}
      <div className="mb-1 text-sm font-bold uppercase tracking-widest text-emerald-600">
        {meta.name}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-slate-900">{meta.price}</span>
        <span className="text-sm text-slate-400">{meta.period}</span>
      </div>
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 w-fit">
        <Clock className="h-3 w-3" />
        {meta.trial} — $0 for 14 days
      </div>
      <p className="mt-3 text-sm text-slate-600">{meta.description}</p>
      <ul className="mt-4 flex-1 space-y-2">
        {meta.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onUpgrade(plan)}
        className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
          meta.highlighted
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-slate-900 text-white hover:bg-slate-800"
        }`}
      >
        {meta.cta}
      </button>
    </div>
  );
}

export function PaywallGate({
  requiredPlan,
  featureName,
  featureDescription,
  currentPlan = "free",
}: PaywallGateProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"website" | "pro" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plansToShow: ("website" | "pro")[] =
    requiredPlan === "pro" ? ["website", "pro"] : ["website", "pro"];

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
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Lock className="h-7 w-7 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {featureName} requires a paid plan
          </h2>
          {featureDescription && (
            <p className="mt-3 text-base text-slate-500">{featureDescription}</p>
          )}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            14-day free trial — no charge for 2 weeks
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {plansToShow.map((plan) => (
            <div key={plan} className="relative">
              {requiredPlan === plan && (
                <div className="absolute -top-2.5 right-4 z-10 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-bold text-white shadow">
                  Required for this feature
                </div>
              )}
              {loading === plan ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </div>
              ) : (
                <PlanCard plan={plan} onUpgrade={handleUpgrade} />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Your free plan includes unlimited donations, embeds, events, goals, givers, peers, and more.{" "}
          <Link href="/pricing" className="font-medium text-emerald-600 hover:text-emerald-700">
            View full pricing
            <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </div>
  );
}
