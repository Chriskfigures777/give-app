import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

/**
 * Check Stripe Connect account verification status and update onboarding_completed.
 * Call this when the user exits the embedded onboarding flow so the UI updates immediately.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { organizationId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // no body is ok
    }

    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("role, organization_id, preferred_organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileRow as
      | { role: string; organization_id: string | null; preferred_organization_id: string | null }
      | null;
    const orgId =
      body.organizationId ??
      profile?.organization_id ??
      profile?.preferred_organization_id;

    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, stripe_connect_account_id, owner_user_id")
      .eq("id", orgId)
      .single();

    const org = orgRow as {
      id: string;
      stripe_connect_account_id: string | null;
      owner_user_id: string | null;
    } | null;

    if (!org?.stripe_connect_account_id) {
      return NextResponse.json({ verified: false });
    }

    const isPlatformAdmin = profile?.role === "platform_admin";
    const isOwner = org.owner_user_id === user.id;
    const { data: adminRow } = await supabase
      .from("organization_admins")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isPlatformAdmin && !isOwner && !adminRow) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const account = await stripe.accounts.retrieve(org.stripe_connect_account_id);
    const chargesEnabled = account.charges_enabled === true;
    const payoutsEnabled = account.payouts_enabled === true;
    const hasRequirements =
      (account.requirements?.currently_due?.length ?? 0) > 0 ||
      (account.requirements?.eventually_due?.length ?? 0) > 0;
    const detailsSubmitted = account.details_submitted === true;
    const verified = chargesEnabled || payoutsEnabled;
    const onboardingCompleted = hasRequirements
      ? false
      : verified || detailsSubmitted;

    const serviceSupabase = createServiceClient();
    await serviceSupabase
      .from("organizations")
      .update({
        onboarding_completed: onboardingCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/connect/verify");

    return NextResponse.json({
      verified,
      pending: detailsSubmitted && !verified && !hasRequirements,
      actionsRequired: hasRequirements,
    });
  } catch (e) {
    console.error("check-verification error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Check failed" },
      { status: 500 }
    );
  }
}
