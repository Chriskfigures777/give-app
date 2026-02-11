import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";
import { SiteFooter } from "@/components/site-footer";

type Props = { searchParams: Promise<{ org?: string; frequency?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { org: orgSlug, frequency } = await searchParams;
  const orgSlugStr = (typeof orgSlug === "string" ? orgSlug : orgSlug?.[0]) ?? null;
  const frequencyStr = (typeof frequency === "string" ? frequency : frequency?.[0]) ?? null;

  // When coming from give page with org, redirect to give page after signup/login (preserving frequency)
  const returnToGive = orgSlugStr ? `/give/${orgSlugStr}${frequencyStr ? `?frequency=${encodeURIComponent(frequencyStr)}` : ""}` : null;
  if (user && returnToGive) redirect(returnToGive);
  if (user) redirect("/dashboard");

  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-slate-50">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Create an account
          </h1>
          <p className="text-slate-600 mb-8">
            A few quick questions to get you started.
          </p>
          <SignupForm redirectTo={returnToGive ?? "/dashboard"} orgSlug={orgSlugStr} frequency={frequencyStr} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
