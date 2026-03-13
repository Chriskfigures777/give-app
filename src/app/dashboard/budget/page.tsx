import { requireAuth } from "@/lib/auth";
import { BudgetClient } from "./budget-client";

export const metadata = { title: "Budget | Exchange" };

export default async function BudgetPage() {
  const { profile, supabase } = await requireAuth();

  // Only use organization_id — donors have preferred_organization_id but are
  // not members/admins of that org and should NOT see the church budget toggle.
  const orgId = profile?.organization_id ?? null;

  let orgName: string | null = null;
  if (orgId) {
    const { data } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();
    orgName = data?.name ?? null;
  }

  return (
    <BudgetClient
      userId={profile?.id ?? "guest"}
      orgId={orgId}
      orgName={orgName}
    />
  );
}
