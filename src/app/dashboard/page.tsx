import { DashboardOverview } from "./dashboard-overview";
import type { DonationRow, OrganizationRow } from "./dashboard-types";
import { getCachedDashboardAuth } from "@/lib/auth";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { ConvertToMissionaryButton } from "./convert-to-missionary-button";

type CampaignRow = {
  id: string;
  name: string;
  description: string | null;
  goal_amount_cents: number | null;
  current_amount_cents: number | null;
  goal_deadline: string | null;
  created_at: string | null;
  is_active: boolean | null;
};

export default async function DashboardPage() {
  const { profile, supabase, orgId, isPlatformAdmin, isMissionary, missionarySponsorOrgId } = await getCachedDashboardAuth();

  const isGiverOnly = !orgId && !isPlatformAdmin && (profile?.role === "donor" || profile?.role === "missionary");
  const showConvertToMissionary = isGiverOnly && !isMissionary && profile?.role !== "missionary" && !profile?.plans_to_be_missionary;

  const donationsQuery = supabase
    .from("donations")
    .select(`
      id,
      amount_cents,
      status,
      created_at,
      organization_id,
      donor_email,
      donor_name,
      currency,
      campaign_id,
      endowment_fund_id,
      organizations(name, slug),
      donation_campaigns(name),
      endowment_funds(name)
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!isPlatformAdmin && orgId) {
    donationsQuery.eq("organization_id", orgId);
  }

  const campaignsQuery =
    orgId && !isPlatformAdmin
      ? supabase
          .from("donation_campaigns")
          .select("id, name, description, goal_amount_cents, current_amount_cents, goal_deadline, created_at, is_active")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
          .limit(20)
      : null;

  const [donationsResult, orgsResult, campaignsResult] = await Promise.all([
    donationsQuery,
    isPlatformAdmin
      ? supabase
          .from("organizations")
          .select("id, name, slug, org_type, created_at, onboarding_completed")
          .limit(200)
      : orgId
        ? supabase
            .from("organizations")
            .select("id, name, slug, org_type, created_at, onboarding_completed")
            .eq("id", orgId)
        : { data: [] as OrganizationRow[] },
    campaignsQuery ?? Promise.resolve({ data: [] as CampaignRow[] }),
  ]);

  const donations = (donationsResult.data ?? []) as unknown as DonationRow[];
  const organizations = (orgsResult.data ?? []) as OrganizationRow[];
  const campaigns = (campaignsResult.data ?? []) as CampaignRow[];
  const userOrg = orgId ? organizations.find((o) => o.id === orgId) : null;
  const needsVerification = !isPlatformAdmin && orgId && userOrg && !userOrg.onboarding_completed;

  return (
    <div className="space-y-6">
      {showConvertToMissionary && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-800/40">
              <Share2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-dashboard-text">Convert to missionary</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-dashboard-text-muted">
                Planning to receive support through a church or nonprofit? Convert your account to a missionary. Once a church or nonprofit connects with you and adds you as their missionary, you&apos;ll get an embed code to share anywhere you&apos;d like to receive funding.
              </p>
              <div className="mt-4">
                <ConvertToMissionaryButton />
              </div>
            </div>
          </div>
        </div>
      )}

      {isGiverOnly && (isMissionary || profile?.role === "missionary") && !missionarySponsorOrgId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800/50 dark:bg-amber-900/20">
          <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">Waiting for connection</h2>
          <p className="mt-2 text-amber-800 dark:text-amber-200">
            You&apos;re set up as a missionary. Once a church or nonprofit connects with you and adds you as their missionary, you&apos;ll see your embed code in <Link href="/dashboard/missionary" className="font-semibold text-amber-700 underline dark:text-amber-300">My embed</Link>.
          </p>
        </div>
      )}

      <DashboardOverview
        donations={donations}
        organizations={organizations}
        campaigns={campaigns}
        isPlatformAdmin={!!isPlatformAdmin}
        userName={profile?.full_name ?? null}
        needsVerification={!!needsVerification}
      />
    </div>
  );
}
