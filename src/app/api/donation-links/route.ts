import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { requireOrgAdmin } from "@/lib/auth";
import { SPLITS_ENABLED } from "@/lib/feature-flags";
import { getOrgPlan, getEffectiveFormLimit, getEffectiveSplitRecipientLimit } from "@/lib/plan";
import { getVerificationStatus } from "@/lib/verification";

export type SplitEntry = {
  percentage: number;
  accountId?: string;
};

/** GET: List donation links for the user's organization */
export async function GET(req: NextRequest) {
  try {
    const { supabase, organizationId } = await requireOrgAdmin();
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("donation_links")
      .select("id, stripe_product_id, name, slug, splits, organization_id, endowment_fund_id, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Donation links list error:", error);
      return NextResponse.json({ error: "Failed to list donation links" }, { status: 500 });
    }

    return NextResponse.json({ donationLinks: data ?? [] });
  } catch (e) {
    console.error("Donation links GET error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** POST: Create a donation link (Stripe product with metadata.splits) */
export async function POST(req: NextRequest) {
  if (!SPLITS_ENABLED) {
    return NextResponse.json({ error: "Donation links with splits are not available yet" }, { status: 403 });
  }
  try {
    const { supabase, organizationId, profile } = await requireOrgAdmin();
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    // Verify Stripe Connect is set up before allowing donation form creation
    if (profile?.role !== "platform_admin") {
      const { data: orgCheck } = await supabase
        .from("organizations")
        .select("stripe_connect_account_id, onboarding_completed")
        .eq("id", organizationId)
        .single();
      const orgInfo = orgCheck as { stripe_connect_account_id: string | null; onboarding_completed: boolean | null } | null;
      if (orgInfo?.onboarding_completed !== true) {
        const vStatus = await getVerificationStatus(orgInfo?.stripe_connect_account_id ?? null);
        if (vStatus !== "verified") {
          return NextResponse.json(
            {
              error: "Your Stripe Connect account must be verified before you can create donation forms. Please complete account setup in Settings.",
              code: "VERIFICATION_REQUIRED",
            },
            { status: 403 }
          );
        }
      }
    }

    const body = await req.json();
    const { name, slug, splits } = body as {
      name: string;
      slug: string;
      splits: SplitEntry[];
    };

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const { plan, planStatus } = await getOrgPlan(organizationId, supabase);
    const formLimit = getEffectiveFormLimit(plan, planStatus);

    const { count: existingCount } = await supabase
      .from("donation_links")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    if ((existingCount ?? 0) >= formLimit) {
      const upgradePlan = plan === "free" ? "Growth" : plan === "growth" ? "Pro" : null;
      return NextResponse.json(
        {
          error: `You've reached the form limit for your ${plan === "free" ? "Free" : plan === "growth" ? "Growth" : "Pro"} plan (${formLimit} forms). ${
            upgradePlan ? `Upgrade to the ${upgradePlan} plan to create more.` : ""
          }`,
          code: "FORM_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    const splitsArray = Array.isArray(splits) ? splits : [];
    const totalPercent = splitsArray.reduce((s, e) => s + (e.percentage ?? 0), 0);
    if (totalPercent !== 100 || splitsArray.length === 0) {
      return NextResponse.json(
        { error: "Splits must total 100% and have at least one entry" },
        { status: 400 }
      );
    }

    for (const e of splitsArray) {
      if (typeof e.percentage !== "number") {
        return NextResponse.json(
          { error: "Each split must have percentage" },
          { status: 400 }
        );
      }
      if (!e.accountId) {
        return NextResponse.json(
          { error: "Each split must have accountId (connected organization)" },
          { status: 400 }
        );
      }
    }

    const recipientLimit = getEffectiveSplitRecipientLimit(plan, planStatus);
    const uniqueRecipients = new Set(splitsArray.map((e) => e.accountId));
    if (uniqueRecipients.size > recipientLimit) {
      return NextResponse.json(
        {
          error: `Your ${plan === "free" ? "Free" : plan === "growth" ? "Growth" : "Pro"} plan allows ${recipientLimit} split recipient${recipientLimit === 1 ? "" : "s"}. Upgrade for more.`,
          code: "SPLIT_RECIPIENT_LIMIT",
        },
        { status: 403 }
      );
    }

    const slugClean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const { data: existing } = await supabase
      .from("donation_links")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("slug", slugClean)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "Slug already in use for this organization" },
        { status: 400 }
      );
    }

    const product = await stripe.products.create({
      name: name.trim(),
      metadata: {
        organization_id: organizationId,
        splits: JSON.stringify(splitsArray),
      },
    });

    const { error: insertError } = await supabase.from("donation_links")
      // @ts-ignore - donation_links Insert type
      .insert({
      organization_id: organizationId,
      stripe_product_id: product.id,
      name: name.trim(),
      slug: slugClean,
      splits: splitsArray,
      split_mode: "stripe_connect",
    });

    if (insertError) {
      console.error("Donation link insert error:", insertError);
      await stripe.products.del(product.id).catch(() => {});
      return NextResponse.json(
        { error: "Failed to save donation link" },
        { status: 500 }
      );
    }

    const { data: link } = await supabase
      .from("donation_links")
      .select("id, stripe_product_id, name, slug, splits, created_at")
      .eq("stripe_product_id", product.id)
      .single();

    return NextResponse.json({ donationLink: link });
  } catch (e) {
    console.error("Donation links POST error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
