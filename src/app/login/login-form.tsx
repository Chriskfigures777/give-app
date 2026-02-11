"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TypeformForm } from "@/components/typeform-form";

type LoginFormProps = {
  redirectTo?: string;
  orgName?: string | null;
  /** Organization slug when logging in from org context - saved to donor profile */
  orgSlug?: string | null;
  /** Payment frequency when coming from recurring give flow */
  frequency?: string | null;
  /** "organization" = nonprofit login; default = giver login */
  loginType?: "giver" | "organization";
};

const STEPS = [
  { label: "What's your email?", name: "email", type: "email" as const, required: true, autoComplete: "email" },
  { label: "Enter your password", name: "password", type: "password" as const, required: true, autoComplete: "current-password" },
];

export function LoginForm({ redirectTo = "/dashboard", orgName, orgSlug, frequency, loginType = "giver" }: LoginFormProps) {
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
    // When donor logs in from org context, save org to profile for quick giving
    if (loginType === "giver" && orgSlug) {
      try {
        await fetch("/api/donor/save-organization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: orgSlug }),
        });
      } catch {
        // Non-blocking - donor can still use the app
      }
    }
    router.refresh();
    // Full redirect so auth state is properly loaded on destination (give page or dashboard)
    window.location.href = redirectTo;
  }

  return (
    <div className="w-full max-w-md">
      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <TypeformForm
        steps={STEPS}
        onSubmit={handleSubmit}
        submitLabel="Sign in"
        loading={loading}
      />
      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          href={orgSlug ? `/signup?org=${encodeURIComponent(orgSlug)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}` : "/signup"}
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          Sign up
        </Link>
      </p>
      {loginType === "giver" ? (
        <p className="mt-3 text-center text-sm text-slate-500">
          Nonprofit?{" "}
          <Link href="/login/organization" className="font-medium text-emerald-600 hover:text-emerald-700">
            Sign in to your organization
          </Link>
        </p>
      ) : (
        <p className="mt-3 text-center text-sm text-slate-500">
          Giver?{" "}
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            Sign in as giver
          </Link>
        </p>
      )}
    </div>
  );
}
