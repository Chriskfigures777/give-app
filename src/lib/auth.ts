import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Role = "donor" | "organization_admin" | "platform_admin";

export type AuthProfile = {
  id: string;
  role: string;
  organization_id: string | null;
  preferred_organization_id: string | null;
};

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}

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
    .select("id, role, organization_id, preferred_organization_id")
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
