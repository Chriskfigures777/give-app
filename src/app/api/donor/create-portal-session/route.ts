import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

/**
 * Create a Stripe Customer Portal session so donors can manage their subscriptions.
 * POST body: { returnUrl?: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { returnUrl = "/dashboard/my-donations" } = body as { returnUrl?: string };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const returnUrlFull = returnUrl.startsWith("http") ? returnUrl : `${baseUrl}${returnUrl.startsWith("/") ? "" : "/"}${returnUrl}`;

    // Get user's stripe_customer_id from donor_subscriptions
    const { data: subRow } = await supabase
      .from("donor_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const customerId = (subRow as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: "No subscription found to manage" },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrlFull,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("create-portal-session error", e);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
