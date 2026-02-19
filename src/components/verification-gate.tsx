"use client";

import Link from "next/link";
import {
  Shield,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

type VerificationStatus = "none" | "actions_required" | "pending" | "verified";

type VerificationGateProps = {
  featureName: string;
  featureDescription?: string;
  verificationStatus: VerificationStatus;
};

const STATUS_CONFIG: Record<
  Exclude<VerificationStatus, "verified">,
  { title: string; description: string; icon: typeof Shield; iconColor: string; bgColor: string; borderColor: string }
> = {
  none: {
    title: "Set up your payout account first",
    description:
      "Before you can publish public pages or create donation forms, you need to connect a Stripe account so donations can be processed. This only takes a few minutes.",
    icon: CreditCard,
    iconColor: "text-slate-500",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
  },
  actions_required: {
    title: "Complete your account verification",
    description:
      "Your Stripe Connect account needs additional information before you can go live. Please complete the remaining verification steps so your donation buttons work properly.",
    icon: AlertCircle,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  pending: {
    title: "Account verification in progress",
    description:
      "Your Stripe Connect account is being reviewed. Once verification is complete, you'll be able to publish public pages and create donation forms. This usually takes 1–2 business days.",
    icon: Clock,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
};

export function VerificationGate({
  featureName,
  featureDescription,
  verificationStatus,
}: VerificationGateProps) {
  if (verificationStatus === "verified") return null;

  const config = STATUS_CONFIG[verificationStatus];
  const Icon = config.icon;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Icon */}
        <div className="mb-6 text-center">
          <div
            className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${config.bgColor}`}
          >
            <Icon className={`h-8 w-8 ${config.iconColor}`} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {config.title}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            to access <span className="font-semibold text-slate-700 dark:text-slate-300">{featureName}</span>
          </p>
        </div>

        {/* Card */}
        <div
          className={`rounded-2xl border ${config.borderColor} bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50`}
        >
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {config.description}
          </p>

          {featureDescription && (
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              {featureDescription}
            </p>
          )}

          <div className="mt-6 space-y-3">
            {verificationStatus !== "pending" && (
              <Link
                href="/dashboard/connect/verify"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <CreditCard className="h-4 w-4" />
                {verificationStatus === "none"
                  ? "Set up Stripe Connect"
                  : "Complete verification"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <Link
              href="/dashboard/settings"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              View account settings
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Checklist */}
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-700/50 dark:bg-slate-800/30">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            What you need
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Stripe Connect account created", done: verificationStatus !== "none" },
              { label: "Verification details submitted", done: verificationStatus === "pending" },
              { label: "Account verified & charges enabled", done: false },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-2.5 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                )}
                <span
                  className={
                    item.done
                      ? "text-slate-500 line-through dark:text-slate-400"
                      : "text-slate-700 dark:text-slate-300"
                  }
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
