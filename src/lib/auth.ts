import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Role = "donor" | "organization_admin" | "platform_admin" | "missionary";

export type AuthProfile = {
  id: string;
  role: string;
  full_name: string | null;
  organization_id: string | null;
  preferred_organization_id: string | null;
  is_missionary?: boolean | null;
  missionary_sponsor_org_id?: string | null;
  plans_to_be_missionary?: boolean | null;
};

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
});

/** Use in server components / actions when auth is required. */
export async function requireAuth(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getSession>>["user"]>;
  profile: AuthProfile | null;
  supabase: Awaited<ReturnType<typeof getSession>>["supabase"];
}> {
  const { user, supabase } = await getSession();
  if (!user) redirect("/login");
  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("id, role, full_name, organization_id, preferred_organization_id, is_missionary, missionary_sponsor_org_id, plans_to_be_missionary")
    .eq("id", user.id)
    .single();
  const profile = profileRow as AuthProfile | null;
  return { user, profile: profile ?? null, supabase };
}

/** Require platform_admin role. */
export async function requirePlatformAdmin() {
  const { user, profile, supabase } = await requireAuth();
  if (profile?.role !== "platform_admin") redirect("/dashboard");
  return { user, profile, supabase };
}

/** Cached dashboard auth: user + profile + org onboarding. Deduplicated across layout and child pages. */
export const getCachedDashboardAuth = cache(async () => {
  const { user, supabase } = await getSession();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("id, role, full_name, organization_id, preferred_organization_id, is_missionary, missionary_sponsor_org_id, plans_to_be_missionary")
    .eq("id", user.id)
    .single();

  const profile = profileRow as AuthProfile | null;
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  const isPlatformAdmin = profile?.role === "platform_admin";

  let onboardingCompleted = false;
  if (orgId && !isPlatformAdmin) {
    const { data: org } = await supabase
      .from("organizations")
      .select("onboarding_completed")
      .eq("id", orgId)
      .single();
    onboardingCompleted = (org as { onboarding_completed: boolean | null } | null)?.onboarding_completed === true;
  }

  const isMissionary = profile?.is_missionary === true || profile?.role === "missionary";
  const missionarySponsorOrgId = profile?.missionary_sponsor_org_id ?? null;

  return {
    user,
    profile,
    supabase,
    orgId: orgId ?? null,
    isPlatformAdmin: !!isPlatformAdmin,
    onboardingCompleted,
    isMissionary,
    missionarySponsorOrgId,
  };
});

/** Require org admin (owner or organization_admin). */
export async function requireOrgAdmin(organizationId?: string) {
  const { user, profile, supabase } = await requireAuth();
  const isPlatformAdmin = profile?.role === "platform_admin";
  if (isPlatformAdmin) return { user, profile, supabase };
  const orgId = organizationId ?? profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, owner_user_id")
    .eq("id", orgId)
    .single();
  const org = orgRow as { id: string; owner_user_id: string | null } | null;
  const isOwner = org?.owner_user_id === user.id;
  const { data: adminRow } = await supabase
    .from("organization_admins")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!isOwner && !adminRow) redirect("/dashboard");
  return { user, profile, supabase, organizationId: orgId };
}
