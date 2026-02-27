"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TypeformForm } from "@/components/typeform-form";

const STEPS = [
  {
    label: "Enter your email",
    name: "email",
    type: "email" as const,
    required: true,
    autoComplete: "email",
    placeholder: "you@example.com",
  },
];

function getRedirectUrl(): string {
  return `${window.location.origin}/auth/recovery?next=/update-password`;
}

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(data: Record<string, string>) {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const email = data.email?.trim();
      if (!email) {
        setError("Email is required");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const redirectTo = getRedirectUrl() || undefined;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      setMessage(
        "If an account exists with that email, you will receive a password reset link. Check your inbox and spam folder."
      );
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700" role="status">
            {message}
          </p>
        </div>
      )}

      <TypeformForm
        steps={STEPS}
        onSubmit={handleSubmit}
        submitLabel="Send reset link"
        loading={loading}
      />
    </div>
  );
}
