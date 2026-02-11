import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import { SiteFooter } from "@/components/site-footer";

type Props = { searchParams: Promise<{ org?: string; frequency?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { org: orgSlug, frequency } = await searchParams;
  const orgSlugStr = (typeof orgSlug === "string" ? orgSlug : orgSlug?.[0]) ?? null;
  const frequencyStr = (typeof frequency === "string" ? frequency : frequency?.[0]) ?? null;

  // When coming from give page with org, redirect to give page after login (preserving frequency)
  const returnToGive = orgSlugStr ? `/give/${orgSlugStr}${frequencyStr ? `?frequency=${encodeURIComponent(frequencyStr)}` : ""}` : null;
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
    <>
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-slate-50">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {orgName ? `Sign in to ${orgName}` : "Giver login"}
          </h1>
          <p className="text-slate-600 mb-8">
            {orgName ? "Enter your details to access your dashboard." : "Sign in to give and manage your giving history."}
          </p>
          <LoginForm redirectTo={returnToGive ?? "/dashboard"} orgName={orgName} orgSlug={orgSlugStr} frequency={frequencyStr} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
