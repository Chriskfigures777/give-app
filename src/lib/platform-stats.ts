import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/supabase";

export type PlatformStats = {
  totalOrganizations: number;
  totalDonations: number;
  totalDonatedCents: number;
  uniqueDonors: number;
  totalEvents: number;
  totalCampaigns: number;
};

async function fetchPlatformStatsUncached(): Promise<PlatformStats> {
  const { url, anonKey } = getSupabaseEnv();
  const supabase = createClient<Database>(url, anonKey);

  const [orgsResult, donationsResult, donorsResult, eventsResult, campaignsResult] =
    await Promise.all([
      supabase.from("organizations").select("id", { count: "exact", head: true }),
      supabase
        .from("donations")
        .select("amount_cents", { count: "exact" })
        .eq("status", "succeeded"),
      supabase
        .from("donations")
        .select("donor_email")
        .eq("status", "succeeded")
        .not("donor_email", "is", null),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase
        .from("donation_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

  const totalOrganizations = orgsResult.count ?? 0;
  const totalDonations = donationsResult.count ?? 0;
  const totalEvents = eventsResult.count ?? 0;
  const totalCampaigns = campaignsResult.count ?? 0;

  const totalDonatedCents = (donationsResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount_cents ?? 0),
    0
  );

  const uniqueEmails = new Set(
    (donorsResult.data ?? []).map((r) => r.donor_email).filter(Boolean)
  );
  const uniqueDonors = uniqueEmails.size;

  return {
    totalOrganizations,
    totalDonations,
    totalDonatedCents,
    uniqueDonors,
    totalEvents,
    totalCampaigns,
  };
}

/** Cached platform stats (60s) for fast homepage/pricing loads. */
export const getPlatformStats = unstable_cache(
  fetchPlatformStatsUncached,
  ["platform-stats"],
  { revalidate: 60 }
);
