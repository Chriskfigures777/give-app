import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session for managing the platform subscription.
 * Requires: authenticated org admin with an active billing customer.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("organization_id, preferred_organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileRow as {
      organization_id: string | null;
      preferred_organization_id: string | null;
    } | null;

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { data: orgRow } = await supabase
      .from("organizations")
      .select("stripe_billing_customer_id")
      .eq("id", orgId)
      .single();

    const customerId = (orgRow as { stripe_billing_customer_id: string | null } | null)
      ?.stripe_billing_customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe to a plan first." },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("billing/portal error", e);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
