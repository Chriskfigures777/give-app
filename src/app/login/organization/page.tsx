import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "../login-form";
import Link from "next/link";

export default async function OrganizationLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
            Manage your
            <br />
            organization.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            Sign in to customize checkout forms, view donations, and manage your
            organization&apos;s campaigns.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Give. All rights reserved.
          </p>
        </div>

        <div className="orb orb-emerald absolute -left-32 bottom-1/4 h-[500px] w-[500px]" />
        <div className="orb orb-violet absolute -right-24 top-1/4 h-[400px] w-[400px]" />
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
            Nonprofit login
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Sign in to manage your organization, customize checkout &amp; embed
            forms, and view donations.
          </p>

          <div className="mt-10">
            <LoginForm redirectTo="/dashboard" loginType="organization" />
          </div>
        </div>
      </main>
    </div>
  );
}
