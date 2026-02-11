"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/lib/use-user";

export function GiveSignInPrompt({ slug, initialFrequency }: { slug: string; initialFrequency?: string }) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const frequency = searchParams.get("frequency") ?? initialFrequency;
  if (user) return null;

  const loginUrl = `/login?org=${encodeURIComponent(slug)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}`;

  return (
    <p className="mt-4 text-center text-sm text-slate-500">
      <Link
        href={loginUrl}
        className="text-emerald-600 hover:underline font-medium"
      >
        Sign in
      </Link>
      {" "}
      {frequency === "monthly" || frequency === "yearly"
        ? "to set up and manage your recurring gift."
        : "to save this organization to your profile and give again quickly from your dashboard."}
    </p>
  );
}
