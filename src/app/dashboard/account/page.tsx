import { requireAuth } from "@/lib/auth";
import { AccountProfileClient } from "./account-profile-client";

export const metadata = { title: "My Profile — Dashboard" };

export default async function AccountPage() {
  const { user, profile, supabase } = await requireAuth();

  // Fetch extended profile fields not in AuthProfile
  const { data: extProfile } = await supabase
    .from("user_profiles")
    .select("email, business_description")
    .eq("id", user.id)
    .single();
  const ext = extProfile as { email: string | null; business_description: string | null } | null;

  const avatarUrl =
    (user.user_metadata?.avatar_url as string) ??
    (user.user_metadata?.picture as string) ??
    null;

  return (
    <AccountProfileClient
      userId={user.id}
      initialName={profile?.full_name ?? ""}
      initialBio={ext?.business_description ?? ""}
      role={profile?.role ?? "member"}
      email={ext?.email ?? user.email ?? ""}
      avatarUrl={avatarUrl}
    />
  );
}
