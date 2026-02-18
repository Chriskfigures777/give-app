import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * Create a feed item when a donor shares "I just gave to X" from the give complete page.
 * POST body: { organization_id?: string; slug?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { supabase, user, profile } = await requireAuth();

    const body = await req.json();
    const organizationId = body?.organization_id ?? null;
    const slug = body?.slug ?? null;

    let orgId: string | null = organizationId;
    if (!orgId && slug) {
      const { data: orgRow } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("slug", slug)
        .single();
      orgId = (orgRow as { id: string; name: string; slug: string } | null)?.id ?? null;
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID or slug required" },
        { status: 400 }
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("id", orgId)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const orgRow = org as { id: string; name: string; slug: string };
    const content = `I just gave to ${orgRow.name}!`;

    const { data: post, error } = await supabase
      .from("feed_items")
      .insert({
        item_type: "post",
        organization_id: orgRow.id,
        author_id: user.id,
        author_type: "user",
        payload: {
          content,
          type: "donation_share",
          organization_name: orgRow.name,
          organization_slug: orgRow.slug,
          author_name: profile?.full_name ?? "Someone",
        },
      })
      .select("id, item_type, organization_id, payload, created_at")
      .single();

    if (error) {
      console.error("Donation share insert error:", error);
      return NextResponse.json({ error: "Failed to share to feed" }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
