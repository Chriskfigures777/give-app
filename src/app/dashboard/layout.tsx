import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "./dashboard-nav";

type LayoutProfile = {
  role: string;
  full_name: string | null;
  organization_id: string | null;
  preferred_organization_id: string | null;
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("role, full_name, organization_id, preferred_organization_id")
    .eq("id", user.id)
    .single();

  const profile = profileRow as LayoutProfile | null;
  const isPlatformAdmin = profile?.role === "platform_admin";
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  let onboardingCompleted = false;
  if (orgId && !isPlatformAdmin) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("onboarding_completed")
      .eq("id", orgId)
      .single();
    onboardingCompleted = (orgRow as { onboarding_completed: boolean | null } | null)?.onboarding_completed === true;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 shrink-0 border-r border-slate-200/80 bg-white py-6 px-4 shadow-sm">
        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-2 font-bold text-slate-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
            G
          </span>
          Give Dashboard
        </Link>
        <DashboardNav isPlatformAdmin={!!isPlatformAdmin} orgId={orgId ?? null} onboardingCompleted={onboardingCompleted} />
      </aside>
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-end gap-4 border-b border-slate-200/80 bg-white px-6 py-4 shadow-sm">
          <span className="text-sm font-medium text-slate-700">
            {profile?.full_name ?? user.email}
          </span>
          <form action="/api/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              Sign out
            </Button>
          </form>
        </header>
        <main className="flex-1 p-6 bg-slate-50/50">{children}</main>
      </div>
    </div>
  );
}
