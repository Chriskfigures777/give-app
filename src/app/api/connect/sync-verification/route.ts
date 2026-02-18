import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

/**
 * Dev/admin endpoint: sync Stripe verification status for an organization.
 * Use curl to manually trigger for testing. In production, the webhook handles this.
 *
 * curl -X POST http://localhost:3000/api/connect/sync-verification \
 *   -H "Content-Type: application/json" \
 *   -H "X-Sync-Secret: your-secret" \
 *   -d '{"organizationName": "CB Figures House"}'
 *
 * Or by ID: -d '{"organizationId": "eb517360-3856-41a3-b627-1e35f9dac053"}'
 */
export async function POST(req: Request) {
  const syncSecret = process.env.CONNECT_SYNC_SECRET?.trim();
  if (syncSecret) {
    const headerSecret = req.headers.get("X-Sync-Secret");
    if (headerSecret !== syncSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    let body: { organizationId?: string; organizationName?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Body must be JSON with organizationId or organizationName" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    type OrgRow = { id: string; name: string; stripe_connect_account_id: string | null };
    let orgRow: OrgRow | null = null;

    if (body.organizationId) {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, stripe_connect_account_id")
        .eq("id", body.organizationId)
        .single();
      orgRow = data as OrgRow | null;
    } else if (body.organizationName) {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, stripe_connect_account_id")
        .ilike("name", `%${body.organizationName}%`)
        .limit(1)
        .maybeSingle();
      orgRow = data as OrgRow | null;
    }

    if (!orgRow) {
      return NextResponse.json(
        { error: "Organization not found", organizationName: body.organizationName, organizationId: body.organizationId },
        { status: 404 }
      );
    }

    if (!orgRow.stripe_connect_account_id) {
      return NextResponse.json({
        organizationId: orgRow.id,
        organizationName: orgRow.name,
        verified: false,
        message: "No Stripe Connect account linked",
      });
    }

    const account = await stripe.accounts.retrieve(orgRow.stripe_connect_account_id);
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

    await supabase
      .from("organizations")
      .update({
        onboarding_completed: onboardingCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgRow.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return NextResponse.json({
      organizationId: orgRow.id,
      organizationName: orgRow.name,
      stripeAccountId: orgRow.stripe_connect_account_id,
      verified,
      onboardingCompleted,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      hasRequirements,
    });
  } catch (e) {
    console.error("sync-verification error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}
