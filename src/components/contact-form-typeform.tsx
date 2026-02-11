"use client";

import { useState } from "react";
import Link from "next/link";
import { TypeformForm, type TypeformStepConfig } from "./typeform-form";

const STEPS: TypeformStepConfig[] = [
  { label: "What's your name?", name: "name", type: "text", required: true, placeholder: "Your name", autoComplete: "name" },
  { label: "What's your email?", name: "email", type: "email", required: true, placeholder: "you@organization.org", autoComplete: "email" },
  { label: "Organization (optional)", name: "organization", type: "text", placeholder: "Church or nonprofit name" },
  { label: "Anything you'd like to share?", name: "message", type: "textarea", placeholder: "What are you hoping to accomplish with Give?" },
];

type ContactFormTypeformProps = {
  variant?: "standalone" | "footer";
  onSubmitted?: () => void;
};

export function ContactFormTypeform({ variant = "standalone", onSubmitted }: ContactFormTypeformProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Record<string, string>) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
    onSubmitted?.();
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6">
        <p className="font-semibold text-emerald-800">Thanks for reaching out.</p>
        <p className="mt-1 text-emerald-700">
          We&apos;ll be in touch soon. You can{" "}
          <Link href="/signup" className="underline hover:no-underline">create an account</Link> and explore the dashboard.
        </p>
      </div>
    );
  }

  const isFooter = variant === "footer";
  return (
    <div className={isFooter ? "" : "mt-8"}>
      {!isFooter && (
        <>
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Get in touch</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Ready to get started?</h2>
          <p className="mt-3 text-lg text-slate-600">
            Tell us a bit about your organization. We&apos;ll reach out with next steps.
          </p>
        </>
      )}
      {isFooter && (
        <p className="mb-6 text-sm font-medium text-slate-500">Fill in a few quick questions.</p>
      )}
      <TypeformForm
        steps={STEPS}
        onSubmit={handleSubmit}
        submitLabel="Send message"
        loading={loading}
      />
    </div>
  );
}
