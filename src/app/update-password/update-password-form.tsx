"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TypeformForm } from "@/components/typeform-form";

const STEPS = [
  {
    label: "New password",
    name: "password",
    type: "password" as const,
    required: true,
    autoComplete: "new-password",
    placeholder: "Min 6 characters",
  },
];

export function UpdatePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(data: Record<string, string>) {
    setError(null);
    setLoading(true);

    const password = data.password?.trim();
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    router.refresh();
    window.location.href = "/dashboard";
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
        submitLabel="Update password"
        loading={loading}
      />
    </div>
  );
}
