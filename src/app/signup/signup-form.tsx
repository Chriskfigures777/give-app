"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { TypeformForm } from "@/components/typeform-form";

const ACCOUNT_TYPES = [
  { value: "giver", label: "Giver", description: "I want to give to nonprofits and churches. Track my giving and support causes I care about." },
  { value: "organization", label: "Organization", description: "I run a church or nonprofit. Accept donations, customize forms, and manage campaigns." },
] as const;

const STEPS_GIVER = [
  { label: "What's your full name?", name: "fullName", type: "text" as const, required: true, placeholder: "Your name", autoComplete: "name" },
  { label: "What's your email?", name: "email", type: "email" as const, required: true, placeholder: "you@example.com", autoComplete: "email" },
  { label: "Choose a password (min 6 characters)", name: "password", type: "password" as const, required: true, autoComplete: "new-password" },
];

const STEPS_NONPROFIT = [
  { label: "What's your full name?", name: "fullName", type: "text" as const, required: true, placeholder: "Your name", autoComplete: "name" },
  { label: "What's your email?", name: "email", type: "email" as const, required: true, placeholder: "you@example.com", autoComplete: "email" },
  { label: "Organization name (optional)", name: "organizationName", type: "text" as const, required: false, placeholder: "e.g. My Nonprofit Inc" },
  { label: "Choose a password (min 6 characters)", name: "password", type: "password" as const, required: true, autoComplete: "new-password" },
];

type SignupFormProps = {
  redirectTo?: string;
  orgSlug?: string | null;
  frequency?: string | null;
};

export function SignupForm({ redirectTo = "/dashboard", orgSlug, frequency }: SignupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"giver" | "organization" | null>(null);
  const router = useRouter();

  async function handleSubmit(data: Record<string, string>) {
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const role = accountType === "organization" ? "organization_admin" : "donor";
    // After email confirm, redirect to login with org/frequency so user lands back on give page
    const emailRedirectTo = orgSlug
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/login?org=${encodeURIComponent(orgSlug)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}`
      : undefined;
    const { data: signUpData, error: err } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: emailRedirectTo || undefined,
        data: {
          full_name: data.fullName,
          role,
          ...(role === "organization_admin" && data.organizationName?.trim()
            ? { organization_name: data.organizationName.trim() }
            : {}),
        },
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    // If no email confirmation required, user is logged in — redirect to give page
    if (signUpData?.session) {
      if (orgSlug && accountType === "giver") {
        try {
          await fetch("/api/donor/save-organization", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: orgSlug }),
          });
        } catch {
          // Non-blocking
        }
      }
      router.refresh();
      // Full redirect so auth state is properly loaded on destination (give page or dashboard)
      window.location.href = redirectTo;
      return;
    }
    setMessage("Check your email to confirm your account.");
    router.refresh();
  }

  if (accountType === null) {
    return (
      <div className="w-full max-w-md space-y-6">
        <p className="text-slate-600">
          How do you want to use Give?
        </p>
        <div className="space-y-3">
          {ACCOUNT_TYPES.map(({ value, label, description }, i) => (
            <motion.button
              key={value}
              type="button"
              onClick={() => setAccountType(value)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition hover:border-emerald-500 hover:bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <span className="block font-semibold text-slate-900">{label}</span>
              <span className="mt-1 block text-sm text-slate-600">{description}</span>
            </motion.button>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href={orgSlug ? `/login?org=${encodeURIComponent(orgSlug)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}` : "/login"}
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  const steps = accountType === "organization" ? STEPS_NONPROFIT : STEPS_GIVER;
  const loginHref = orgSlug ? `/login?org=${encodeURIComponent(orgSlug)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}` : "/login";

  return (
    <div className="w-full max-w-md">
      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 text-sm text-emerald-700" role="status">
          {message}
        </p>
      )}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <span>Signing up as:</span>
        <span className="font-medium text-slate-700">
          {accountType === "organization" ? "Organization" : "Giver"}
        </span>
        <button
          type="button"
          onClick={() => setAccountType(null)}
          className="text-emerald-600 hover:text-emerald-700"
        >
          Change
        </button>
      </div>
      <TypeformForm
        steps={steps}
        onSubmit={handleSubmit}
        submitLabel="Create account"
        loading={loading}
      />
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-emerald-600 hover:text-emerald-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
