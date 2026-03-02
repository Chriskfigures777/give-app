import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "./update-password-form";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      {/* Left: decorative panel */}
      <div className="auth-gradient hidden w-1/2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <BrandMark fullLogo variant="dark" className="drop-shadow-[0_8px_12px_rgba(16,185,129,0.3)]" id="update-pwd-desktop" />
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold tracking-tight text-white">
            Set a new password
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            Choose a strong password to secure your account.
          </p>
        </div>

        <div className="orb orb-emerald absolute -left-32 bottom-1/4 h-[500px] w-[500px]" />
        <div className="orb orb-cyan absolute -right-24 top-1/4 h-[400px] w-[400px]" />
        <div className="auth-pattern absolute inset-0 opacity-20" />
      </div>

      {/* Right: form */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 bg-white lg:px-16">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <BrandMark fullLogo variant="light" className="drop-shadow-[0_8px_12px_rgba(16,185,129,0.25)]" id="update-pwd-mobile" />
          </Link>
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Update your password
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Enter your new password below.
          </p>

          <div className="mt-10">
            <UpdatePasswordForm />
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            <Link href="/dashboard" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Skip for now
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
