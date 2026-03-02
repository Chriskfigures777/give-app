import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/donations/recent
 * Public endpoint — returns recent succeeded donations (anonymized).
 * Used by the homepage hero for live donation feed.
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("donations")
      .select("id, amount_cents, donor_name, created_at, organizations(name)")
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ donations: [] });
    }

    const donations = (data ?? []).map((d: Record<string, unknown>) => {
      const name = (d.donor_name as string) || "Anonymous";
      const firstInitial = name.charAt(0).toUpperCase();
      const isAnonymous = !d.donor_name || name.toLowerCase() === "anonymous";
      return {
        id: d.id as string,
        amount_cents: d.amount_cents as number,
        donor_initial: firstInitial,
        donor_display: isAnonymous ? "Anonymous" : `${name.split(" ")[0]} ${name.split(" ").pop()?.charAt(0) || ""}.`,
        org_name: (d.organizations as { name: string } | null)?.name ?? null,
        created_at: d.created_at as string,
      };
    });

    return NextResponse.json({ donations }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ donations: [] });
  }
}
