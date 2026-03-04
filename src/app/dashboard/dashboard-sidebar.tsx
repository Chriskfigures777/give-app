import { DashboardNav } from "./dashboard-nav";
import { DashboardThemePicker } from "@/components/dashboard-theme-picker";
import { getCachedDashboardAuth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export async function DashboardSidebar() {
  const { user, profile, orgId, isPlatformAdmin, onboardingCompleted, isMissionary, missionarySponsorOrgId } =
    await getCachedDashboardAuth();

  return (
    <>
      <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden py-4">
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
        <div className="sidebar-user-card flex items-center gap-3 rounded-xl bg-dashboard-card px-4 py-3 transition-all duration-300">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm">
            {(profile?.full_name ?? user.email ?? "U")[0].toUpperCase()}
          </div>
          <div className="sidebar-user-text min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-dashboard-text">
              {profile?.full_name ?? user.email}
            </p>
            <SignOutButton />
          </div>
          <div className="sidebar-user-text">
            <DashboardThemePicker size="sm" />
          </div>
        </div>
      </div>
    </>
  );
}
