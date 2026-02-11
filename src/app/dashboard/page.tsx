import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardOverview } from "./dashboard-overview";
import type { DonationRow, OrganizationRow } from "./dashboard-types";

export default async function DashboardPage() {
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

  type PageProfile = { role: string; full_name: string | null; organization_id: string | null; preferred_organization_id: string | null };
  const profile = profileRow as PageProfile | null;
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  const isPlatformAdmin = profile?.role === "platform_admin";

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

  const [donationsResult, orgsResult] = await Promise.all([
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
  ]);

  const donations = (donationsResult.data ?? []) as unknown as DonationRow[];
  const organizations = (orgsResult.data ?? []) as OrganizationRow[];
  const userOrg = orgId ? organizations.find((o) => o.id === orgId) : null;
  const needsVerification = !isPlatformAdmin && orgId && userOrg && !userOrg.onboarding_completed;

  return (
    <div className="space-y-6">
      <DashboardOverview
        donations={donations}
        organizations={organizations}
        isPlatformAdmin={!!isPlatformAdmin}
        userName={profile?.full_name ?? null}
        needsVerification={!!needsVerification}
      />
    </div>
  );
}
