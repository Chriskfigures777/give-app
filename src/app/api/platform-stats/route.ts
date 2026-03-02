import { NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/platform-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getPlatformStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[platform-stats] Error fetching stats:", error);
    return NextResponse.json(
      {
        totalOrganizations: 0,
        totalDonations: 0,
        totalDonatedCents: 0,
        uniqueDonors: 0,
        totalEvents: 0,
        totalCampaigns: 0,
      },
      { status: 500 }
    );
  }
}
