import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";
import Link from "next/link";

type Props = { searchParams: Promise<{ org?: string; frequency?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { org: orgSlug, frequency } = await searchParams;
  const orgSlugStr =
    (typeof orgSlug === "string" ? orgSlug : orgSlug?.[0]) ?? null;
  const frequencyStr =
    (typeof frequency === "string" ? frequency : frequency?.[0]) ?? null;

  const returnToGive = orgSlugStr
    ? `/give/${orgSlugStr}${frequencyStr ? `?frequency=${encodeURIComponent(frequencyStr)}` : ""}`
    : null;
  if (user && returnToGive) redirect(returnToGive);
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      {/* Left: decorative panel */}
      <div className="auth-gradient hidden w-1/2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-white backdrop-blur-sm">
              G
            </span>
            <span className="text-xl font-bold text-white">Give</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold tracking-tight text-white">
            Start giving
            <br />
            in minutes.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            Join thousands of givers and organizations on the modern donation
            platform. No setup fees. No monthly plans.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Free to sign up—no credit card required",
              "Accept donations from day one",
              "Beautiful forms that match your brand",
              "Transparent fees—only pay when you receive",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg
                    className="h-3.5 w-3.5 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm text-white/70">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Give. All rights reserved.
          </p>
        </div>

        <div className="orb orb-emerald absolute -left-32 bottom-1/4 h-[500px] w-[500px]" />
        <div className="orb orb-violet absolute -right-24 top-1/3 h-[400px] w-[400px]" />
        <div className="auth-pattern absolute inset-0 opacity-20" />
      </div>

      {/* Right: form */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 bg-white lg:px-16">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-bold text-white shadow-lg shadow-emerald-500/25">
              G
            </span>
            <span className="text-xl font-bold text-slate-900">Give</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Create an account
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            A few quick questions to get you started.
          </p>

          <div className="mt-10">
            <SignupForm
              redirectTo={returnToGive ?? "/dashboard"}
              orgSlug={orgSlugStr}
              frequency={frequencyStr}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
