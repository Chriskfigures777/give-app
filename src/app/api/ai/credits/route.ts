import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getRemainingCredits } from "@/lib/ai-credits";

export async function GET() {
  try {
    const { profile } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }
    const credits = await getRemainingCredits(orgId);
    return NextResponse.json(credits);
  } catch (e) {
    console.error("ai/credits GET:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch credits" },
      { status: 500 }
    );
  }
}
