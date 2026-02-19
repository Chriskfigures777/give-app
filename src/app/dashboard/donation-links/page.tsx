import { redirect } from "next/navigation";
import { requireOrgAdmin } from "@/lib/auth";
import { SPLITS_ENABLED } from "@/lib/feature-flags";
import { DonationLinksComingSoon } from "./donation-links-coming-soon";
import { DonationLinksClient } from "./donation-links-client";
import { env } from "@/env";
import { getOrgPlan, getEffectiveFormLimit, type OrgPlan } from "@/lib/plan";

export default async function DonationLinksPage() {
  const { supabase, organizationId } = await requireOrgAdmin();
  if (!organizationId) redirect("/dashboard");

  if (!SPLITS_ENABLED) {
    return <DonationLinksComingSoon />;
  }

  const { plan, planStatus } = await getOrgPlan(organizationId, supabase);
  const formLimit = getEffectiveFormLimit(plan, planStatus);

  const { data: links } = await supabase
    .from("donation_links")
    .select("id, stripe_product_id, name, slug, splits, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  const { data: connAsA } = await supabase
    .from("peer_connections")
    .select("side_b_id, side_b_type")
    .eq("side_a_id", organizationId)
    .eq("side_a_type", "organization");
  const { data: connAsB } = await supabase
    .from("peer_connections")
    .select("side_a_id, side_a_type")
    .eq("side_b_id", organizationId)
    .eq("side_b_type", "organization");

  const peerOrgIds = new Set<string>();
  for (const c of (connAsA ?? []) as { side_b_id: string; side_b_type: string }[]) {
    if (c.side_b_type === "organization") peerOrgIds.add(c.side_b_id);
  }
  for (const c of (connAsB ?? []) as { side_a_id: string; side_a_type: string }[]) {
    if (c.side_a_type === "organization") peerOrgIds.add(c.side_a_id);
  }

  const { data: orgs } = peerOrgIds.size > 0
    ? await supabase
        .from("organizations")
        .select("id, name, slug, stripe_connect_account_id")
        .in("id", Array.from(peerOrgIds))
        .not("stripe_connect_account_id", "is", null)
        .order("name")
    : { data: [] };

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", organizationId)
    .single();

  const baseUrl = env.app.domain().replace(/\/$/, "");

  return (
    <DonationLinksClient
      donationLinks={(links ?? []) as unknown as { id: string; name: string; slug: string; splits: { percentage: number; accountId?: string; splitBankAccountId?: string }[]; split_mode?: string; created_at: string }[]}
      organizations={(orgs ?? []) as { id: string; name: string; slug: string; stripe_connect_account_id: string }[]}
      organizationSlug={(orgRow as { slug: string } | null)?.slug ?? ""}
      baseUrl={baseUrl}
      formLimit={formLimit}
      currentPlan={plan}
    />
  );
}
