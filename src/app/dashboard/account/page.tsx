import { requireAuth } from "@/lib/auth";
import { AccountProfileClient } from "./account-profile-client";

export const metadata = { title: "My Profile — Dashboard" };

export default async function AccountPage() {
  const { user, profile, supabase } = await requireAuth();

  // Fetch extended profile fields
  const { data: extProfile } = await supabase
    .from("user_profiles")
    .select("email, business_description, avatar_url")
    .eq("id", user.id)
    .single();

  const ext = extProfile as {
    email: string | null;
    business_description: string | null;
    avatar_url: string | null;
  } | null;

  // Prefer custom avatar from user_profiles, fall back to OAuth provider avatar
  const avatarUrl =
    ext?.avatar_url ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  // Fetch org name and logo if user has an org
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  let orgName: string | null = null;
  let orgLogoUrl: string | null = null;
  if (orgId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, logo_url")
      .eq("id", orgId)
      .single();
    const orgRow = org as { name: string; logo_url: string | null } | null;
    orgName = orgRow?.name ?? null;
    orgLogoUrl = orgRow?.logo_url ?? null;
  }

  return (
    <AccountProfileClient
      userId={user.id}
      initialName={profile?.full_name ?? ""}
      initialBio={ext?.business_description ?? ""}
      role={profile?.role ?? "member"}
      email={ext?.email ?? user.email ?? ""}
      avatarUrl={avatarUrl}
      organizationId={orgId ?? null}
      organizationName={orgName}
      orgLogoUrl={orgLogoUrl}
    />
  );
}
