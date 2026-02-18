import { Button } from "@/components/ui/button";
import { DashboardNav } from "./dashboard-nav";
import { DashboardThemeToggle } from "@/components/theme-toggle";
import { getCachedDashboardAuth } from "@/lib/auth";

export async function DashboardSidebar() {
  const { user, profile, orgId, isPlatformAdmin, onboardingCompleted, isMissionary, missionarySponsorOrgId } =
    await getCachedDashboardAuth();

  return (
    <>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <DashboardNav
          isPlatformAdmin={isPlatformAdmin}
          orgId={orgId}
          onboardingCompleted={onboardingCompleted}
          isMissionary={isMissionary}
          missionarySponsorOrgId={missionarySponsorOrgId}
          plansToBeMissionary={profile?.plans_to_be_missionary === true}
          profileRole={profile?.role ?? undefined}
        />
      </nav>
      <div className="shrink-0 border-t border-dashboard-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-dashboard-card px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 text-sm font-bold text-white">
            {(profile?.full_name ?? user.email ?? "U")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-dashboard-text">
              {profile?.full_name ?? user.email}
            </p>
            <form action="/api/auth/signout" method="POST" className="mt-0.5">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs font-medium text-dashboard-text-muted hover:text-dashboard-text hover:bg-transparent"
              >
                Sign out
              </Button>
            </form>
          </div>
          <DashboardThemeToggle size="sm" />
        </div>
      </div>
    </>
  );
}
