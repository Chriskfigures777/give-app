import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { DonationsRealtimeClient, type DonationRow } from "./donations-realtime-client";

export default async function DonationsPage() {
  const { profile, supabase } = await requireAuth();
  const isPlatformAdmin = profile?.role === "platform_admin";
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id ?? null;

  const query = supabase
    .from("donations")
    .select(`
      id, amount_cents, currency, status, donor_name, donor_email, created_at,
      organization_id,
      organizations(name, slug),
      donation_campaigns(name)
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!isPlatformAdmin && orgId) {
    query.eq("organization_id", orgId);
  }

  const { data: donationsData } = await query;
  const donations = (donationsData ?? []) as DonationRow[];

  return (
    <DonationsRealtimeClient
      donations={donations}
      orgId={orgId}
      isPlatformAdmin={isPlatformAdmin}
    />
  );
}
