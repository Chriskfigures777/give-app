import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type Props = { searchParams: Promise<{ org?: string; frequency?: string }> };

export default async function LoginPage({ searchParams }: Props) {
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

  let orgName: string | null = null;
  if (orgSlugStr) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("name")
      .eq("slug", orgSlugStr)
      .single();
    const org = orgRow as { name: string } | null;
    orgName = org?.name ?? null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: decorative panel */}
      <div className="auth-gradient hidden w-1/2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <BrandMark className="h-10 w-10 drop-shadow-[0_8px_12px_rgba(16,185,129,0.3)]" id="login-desktop" />
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold tracking-tight text-white">
            Welcome back.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            Sign in to manage your donations, track your giving history, and
            support the causes you care about.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { value: "50k+", label: "Organizations" },
              { value: "2M+", label: "Donations" },
              { value: "99.9%", label: "Uptime" },
              { value: "$0", label: "Setup fee" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Give. All rights reserved.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="orb orb-emerald absolute -left-32 bottom-1/4 h-[500px] w-[500px]" />
        <div className="orb orb-cyan absolute -right-24 top-1/4 h-[400px] w-[400px]" />
        <div className="auth-pattern absolute inset-0 opacity-20" />
      </div>

      {/* Right: form */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 bg-white lg:px-16">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <BrandMark className="h-10 w-10 drop-shadow-[0_8px_12px_rgba(16,185,129,0.25)]" id="login-mobile" />
          </Link>
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {orgName ? `Sign in to ${orgName}` : "Sign in"}
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            {orgName
              ? "Enter your details to access your dashboard."
              : "Welcome back. Sign in to continue."}
          </p>

          <div className="mt-10">
            <LoginForm
              redirectTo={returnToGive ?? "/dashboard"}
              orgName={orgName}
              orgSlug={orgSlugStr}
              frequency={frequencyStr}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
