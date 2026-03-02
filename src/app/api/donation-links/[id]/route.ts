import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { requireOrgAdmin } from "@/lib/auth";

export type SplitEntry = { percentage: number; accountId: string };

/** GET: Fetch a donation link by id */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    const { id } = await params;

    const { data, error } = await supabase
      .from("donation_links")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId!)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Donation link not found" }, { status: 404 });
    }

    return NextResponse.json({ donationLink: data });
  } catch (e) {
    console.error("Donation link GET error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** PATCH: Update donation link (name, slug, splits) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    const { id } = await params;

    const { data: existingData } = await supabase
      .from("donation_links")
      .select("id, stripe_product_id, organization_id")
      .eq("id", id)
      .eq("organization_id", organizationId!)
      .single();

    const existing = existingData as { id: string; stripe_product_id: string; organization_id: string } | null;
    if (!existing) {
      return NextResponse.json({ error: "Donation link not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, slug, splits } = body as {
      name?: string;
      slug?: string;
      splits?: SplitEntry[];
    };

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const stripeUpdates: Record<string, unknown> = {};

    if (name?.trim()) {
      updates.name = name.trim();
      stripeUpdates.name = name.trim();
    }
    if (slug?.trim()) {
      const slugClean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
      updates.slug = slugClean;
    }
    if (Array.isArray(splits)) {
      const totalPercent = splits.reduce((s, e) => s + (e.percentage ?? 0), 0);
      if (totalPercent !== 100 || splits.length === 0) {
        return NextResponse.json(
          { error: "Splits must total 100% and have at least one entry" },
          { status: 400 }
        );
      }
      updates.splits = splits;
      stripeUpdates.metadata = { splits: JSON.stringify(splits) };
    }

    const { error: updateError } = await supabase
      .from("donation_links")
      // @ts-ignore - donation_links Update type
      .update(updates)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    if (Object.keys(stripeUpdates).length > 0) {
      await stripe.products.update(existing.stripe_product_id, stripeUpdates);
    }

    const { data: link } = await supabase
      .from("donation_links")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({ donationLink: link });
  } catch (e) {
    console.error("Donation link PATCH error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** DELETE: Remove donation link */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    const { id } = await params;

    const { data: existingData } = await supabase
      .from("donation_links")
      .select("id, stripe_product_id")
      .eq("id", id)
      .eq("organization_id", organizationId!)
      .single();

    const existing = existingData as { id: string; stripe_product_id: string } | null;
    if (!existing) {
      return NextResponse.json({ error: "Donation link not found" }, { status: 404 });
    }

    await stripe.products.update(existing.stripe_product_id, { active: false });
    const { error: deleteError } = await supabase
      .from("donation_links")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Donation link DELETE error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
