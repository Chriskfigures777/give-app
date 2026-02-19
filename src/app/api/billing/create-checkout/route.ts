import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { getStripePriceId, isPlanStatusActive, type OrgPlan } from "@/lib/plan";

/**
 * POST /api/billing/create-checkout
 * Creates a Stripe Checkout session for new subscriptions, or updates the
 * existing subscription when upgrading between paid plans (website → pro).
 * Requires: authenticated org admin.
 * Body: { plan: 'website' | 'pro' }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body as { plan: OrgPlan };

    if (plan !== "website" && plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get the org for this user
    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("organization_id, preferred_organization_id, role")
      .eq("id", user.id)
      .single();

    const profile = profileRow as {
      organization_id: string | null;
      preferred_organization_id: string | null;
      role: string;
    } | null;

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization found. Create an organization first." },
        { status: 400 }
      );
    }

    // Fetch org details including any existing billing customer & subscription
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, stripe_billing_customer_id, stripe_plan_subscription_id, plan, plan_status")
      .eq("id", orgId)
      .single();

    const org = orgRow as {
      id: string;
      name: string;
      stripe_billing_customer_id: string | null;
      stripe_plan_subscription_id: string | null;
      plan: string | null;
      plan_status: string | null;
    } | null;

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const priceId = getStripePriceId(plan);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // ── Upgrade existing subscription (e.g. website → pro) ──
    // If the org already has an active/trialing subscription, swap the price
    // instead of creating a second subscription.
    if (
      org.stripe_plan_subscription_id &&
      isPlanStatusActive(org.plan_status as import("@/lib/plan").PlanStatus)
    ) {
      const existingSub = await stripe.subscriptions.retrieve(org.stripe_plan_subscription_id);

      if (existingSub.status === "active" || existingSub.status === "trialing") {
        const itemId = existingSub.items.data[0]?.id;
        if (!itemId) {
          return NextResponse.json({ error: "Subscription has no items" }, { status: 500 });
        }

        const updated = await stripe.subscriptions.update(org.stripe_plan_subscription_id, {
          items: [{ id: itemId, price: priceId }],
          proration_behavior: "create_prorations",
          metadata: {
            ...existingSub.metadata,
            plan,
          },
        });

        // @ts-ignore
        await supabase
          .from("organizations")
          .update({
            plan,
            plan_status: updated.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orgId);

        return NextResponse.json({
          url: `${baseUrl}/dashboard/billing?success=1&plan=${plan}`,
          upgraded: true,
        });
      }
    }

    // ── New subscription via Checkout ──
    let customerId = org.stripe_billing_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: { org_id: orgId, user_id: user.id },
      });
      customerId = customer.id;

      // @ts-ignore
      await supabase.from("organizations").update({ stripe_billing_customer_id: customerId }).eq("id", orgId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          type: "platform_plan",
          org_id: orgId,
          plan,
          user_id: user.id,
        },
      },
      metadata: {
        type: "platform_plan",
        org_id: orgId,
        plan,
        user_id: user.id,
      },
      success_url: `${baseUrl}/dashboard/billing?success=1&plan=${plan}`,
      cancel_url: `${baseUrl}/dashboard/billing?canceled=1`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("billing/create-checkout error", e);
    const msg = e instanceof Error ? e.message : "Failed to create checkout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
