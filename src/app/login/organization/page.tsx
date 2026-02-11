import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "../login-form";
import { SiteFooter } from "@/components/site-footer";

export default async function OrganizationLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-slate-50">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Nonprofit login
          </h1>
          <p className="text-slate-600 mb-8">
            Sign in to manage your organization, customize checkout & embed forms, and view donations.
          </p>
          <LoginForm redirectTo="/dashboard" loginType="organization" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
