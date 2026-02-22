"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/lib/use-user";
import { InlineAuthForm } from "./inline-auth-form";

export function GiveSignInPrompt({
  slug,
  initialFrequency,
  organizationName,
}: {
  slug: string;
  initialFrequency?: string;
  organizationName?: string;
}) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const frequency = searchParams.get("frequency") ?? initialFrequency;
  const [showInlineAuth, setShowInlineAuth] = useState(false);

  if (user) return null;

  const loginUrl = `/login?org=${encodeURIComponent(slug)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}`;
  const isRecurring = frequency === "monthly" || frequency === "yearly";

  if (showInlineAuth && isRecurring && organizationName) {
    return (
      <div className="mt-4">
        <InlineAuthForm
          organizationName={organizationName}
          slug={slug}
          frequency={frequency as "monthly" | "yearly"}
          onSuccess={() => setShowInlineAuth(false)}
          onCancel={() => setShowInlineAuth(false)}
        />
      </div>
    );
  }

  return (
    <p className="mt-4 text-center text-sm text-slate-500">
      {isRecurring && organizationName ? (
        <>
          <button
            type="button"
            onClick={() => setShowInlineAuth(true)}
            className="text-emerald-600 hover:underline font-medium bg-transparent border-none cursor-pointer"
            style={{ padding: 0, fontSize: "inherit" }}
          >
            Sign in
          </button>
          {" "}to set up and manage your recurring gift.
        </>
      ) : (
        <>
          <Link
            href={loginUrl}
            className="text-emerald-600 hover:underline font-medium"
          >
            Sign in
          </Link>
          {" "}
          {isRecurring
            ? "to set up and manage your recurring gift."
            : "to save this organization to your profile and give again quickly from your dashboard."}
        </>
      )}
    </p>
  );
}
