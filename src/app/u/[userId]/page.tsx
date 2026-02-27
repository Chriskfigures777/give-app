import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { UserPublicProfileClient } from "./user-public-profile-client";

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();
  const row = data as { full_name: string | null; role: string } | null;
  if (!row) return { title: "Member Profile" };
  return { title: `${row.full_name ?? "Member"} — GIVE Community` };
}

export default async function UserPublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_profiles")
    .select("id, full_name, role, business_description, organization_id")
    .eq("id", userId)
    .single();

  const profile = data as {
    id: string;
    full_name: string | null;
    role: string;
    business_description: string | null;
    organization_id: string | null;
  } | null;

  if (!profile) notFound();

  // Get their affiliated org if any
  let orgInfo: { name: string; slug: string; logo_url: string | null } | null = null;
  if (profile.organization_id) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("name, slug, logo_url")
      .eq("id", profile.organization_id)
      .single();
    orgInfo = (orgRow as { name: string; slug: string; logo_url: string | null } | null);
  }

  // Check if current viewer is logged in (to show Connect button)
  const { user } = await getSession();
  const viewerUserId = user?.id ?? null;

  return (
    <UserPublicProfileClient
      profile={{
        id: profile.id,
        full_name: profile.full_name ?? "Community Member",
        role: profile.role,
        bio: profile.business_description ?? null,
      }}
      orgInfo={orgInfo}
      viewerUserId={viewerUserId}
    />
  );
}
