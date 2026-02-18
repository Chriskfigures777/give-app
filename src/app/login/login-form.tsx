"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TypeformForm } from "@/components/typeform-form";

type LoginFormProps = {
  redirectTo?: string;
  orgName?: string | null;
  orgSlug?: string | null;
  frequency?: string | null;
  loginType?: "giver" | "organization";
};

const STEPS = [
  {
    label: "Welcome back",
    sublabel: "Sign in as a giver or missionary to access your dashboard.",
    name: "welcome",
    type: "info" as const,
    required: false,
  },
  {
    label: "What's your email?",
    name: "email",
    type: "email" as const,
    required: true,
    autoComplete: "email",
    placeholder: "you@example.com",
  },
  {
    label: "Enter your password",
    name: "password",
    type: "password" as const,
    required: true,
    autoComplete: "current-password",
  },
];

export function LoginForm({
  redirectTo = "/dashboard",
  orgName,
  orgSlug,
  frequency,
  loginType = "giver",
}: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(data: Record<string, string>) {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (loginType === "giver" && orgSlug) {
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
    window.location.href = redirectTo;
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        </div>
      )}

      <TypeformForm
        steps={STEPS}
        onSubmit={handleSubmit}
        submitLabel="Sign in"
        loading={loading}
      />

      <div className="mt-8 space-y-3">
        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href={
              orgSlug
                ? `/signup?org=${encodeURIComponent(orgSlug)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}`
                : "/signup"
            }
            className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            Sign up
          </Link>
        </p>
        {loginType === "giver" ? (
          <>
            <p className="text-center text-sm text-slate-400">
              Missionary? Set up your funding form in the dashboard after signing in.
            </p>
            <p className="text-center text-sm text-slate-400">
              Nonprofit?{" "}
              <Link
                href="/login/organization"
                className="font-medium text-emerald-600 hover:text-emerald-700"
              >
                Organization login
              </Link>
            </p>
          </>
        ) : (
          <p className="text-center text-sm text-slate-400">
            Giver?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-600 hover:text-emerald-700"
            >
              Sign in as giver
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
