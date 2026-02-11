import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import { ENDOWMENT_SHARE_OF_PLATFORM_FEE } from "@/lib/stripe/constants";

const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET ||
  process.env.STRIPE_WEBHOOK_SECRET_1 ||
  process.env.STRIPE_WEBHOOK_SECRET_2;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error("Stripe webhook secret not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const metadata = pi.metadata ?? {};
      const organizationId = metadata.organization_id;
      const applicationFeeCents = parseInt(metadata.application_fee_cents ?? "0", 10);

      if (!organizationId || !pi.id) {
        console.error("Missing organization_id or payment_intent id in metadata");
        break;
      }

      const chargeId =
        typeof pi.latest_charge === "string"
          ? pi.latest_charge
          : (pi.latest_charge as Stripe.Charge)?.id ?? null;

      const donationAmountCents =
        parseInt(metadata.donation_amount_cents ?? "0", 10) || pi.amount;

      // @ts-ignore - Supabase client infers insert payload as never in some setups
      const { error: insertError } = await supabase.from("donations").insert({
        amount_cents: donationAmountCents,
        currency: pi.currency ?? "usd",
        donor_email: metadata.donor_email || null,
        donor_name: metadata.donor_name || null,
        endowment_fund_id: metadata.endowment_fund_id || null,
        stripe_payment_intent_id: pi.id,
        stripe_charge_id: chargeId,
        status: "succeeded",
        organization_id: organizationId,
        campaign_id: metadata.campaign_id || null,
        user_id: metadata.user_id || null,
        metadata: { payment_intent: pi.id },
      });

      if (insertError) {
        console.error("Donation insert failed:", insertError);
        return NextResponse.json(
          { error: "Donation record failed" },
          { status: 500 }
        );
      }

      // Save org to donor's profile for quick re-giving
      const donorUserId = metadata.user_id;
      if (donorUserId && organizationId) {
        await supabase
          .from("donor_saved_organizations")
          // @ts-ignore - Supabase infers Insert as never for new tables
          .upsert(
            { user_id: donorUserId, organization_id: organizationId },
            { onConflict: "user_id,organization_id" }
          );
      }

      // Increment campaign goal progress
      const campaignId = metadata.campaign_id;
      if (campaignId && donationAmountCents > 0) {
        const { data: campaign } = await supabase
          .from("donation_campaigns")
          .select("current_amount_cents")
          .eq("id", campaignId)
          .single();
        if (campaign) {
          const current = Number((campaign as { current_amount_cents: number | null }).current_amount_cents ?? 0);
          await supabase
            .from("donation_campaigns")
            // @ts-expect-error - Supabase client infers update payload as never in some setups
            .update({
              current_amount_cents: current + donationAmountCents,
              updated_at: new Date().toISOString(),
            })
            .eq("id", campaignId);
        }
      }

      // Single-pass transfer: 30% of platform fee to endowment (if endowment has Connect account).
      const endowmentFundId = metadata.endowment_fund_id;
      if (applicationFeeCents > 0 && endowmentFundId) {
        const { data: fundRow } = await supabase
          .from("endowment_funds")
          .select("id, stripe_connect_account_id")
          .eq("id", endowmentFundId)
          .single();

        const fund = fundRow as { id: string; stripe_connect_account_id: string | null } | null;
        if (fund?.stripe_connect_account_id) {
          const endowmentCents = Math.round(
            applicationFeeCents * ENDOWMENT_SHARE_OF_PLATFORM_FEE
          );
          if (endowmentCents >= 1) {
            try {
              await stripe.transfers.create({
                amount: endowmentCents,
                currency: pi.currency ?? "usd",
                destination: fund.stripe_connect_account_id,
                description: `Endowment share for donation ${pi.id}`,
                metadata: { payment_intent_id: pi.id, endowment_fund_id: endowmentFundId },
              });
            } catch (transferErr) {
              console.error("Endowment transfer failed:", transferErr);
              // Don't fail the webhook; log and optionally retry later.
            }
          }
        }
      }

      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await supabase
        .from("donations")
        // @ts-ignore - Supabase client infers update payload as never in some setups
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", pi.id);
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) break;

      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      const subscription = await stripe.subscriptions.retrieve(subId, { expand: ["items.data.price"] });
      const metadata = subscription.metadata ?? session.metadata ?? {};

      const organizationId = metadata.organization_id;
      const userId = metadata.user_id;
      if (!organizationId || !userId) break;

      const item = subscription.items.data[0];
      const amountCents = item?.price?.unit_amount ?? 0;
      const interval = (item?.price?.recurring?.interval as "month" | "year") ?? "month";

      // @ts-ignore - Supabase client infers types
      await supabase.from("donor_subscriptions").upsert(
        {
          user_id: userId,
          organization_id: organizationId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          amount_cents: amountCents,
          currency: subscription.currency ?? "usd",
          interval,
          status: subscription.status,
          campaign_id: metadata.campaign_id || null,
        },
        { onConflict: "stripe_subscription_id" }
      );

      // Save org to donor profile
      await supabase
        .from("donor_saved_organizations")
        // @ts-ignore
        .upsert(
          { user_id: userId, organization_id: organizationId },
          { onConflict: "user_id,organization_id" }
        );
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subRef = (invoice as { subscription?: string | { id: string } }).subscription;
      if (!subRef) break;

      const subId = typeof subRef === "string" ? subRef : subRef.id;
      const subscription = await stripe.subscriptions.retrieve(subId);
      const metadata = subscription.metadata ?? {};

      const organizationId = metadata.organization_id;
      const campaignId = metadata.campaign_id;
      const donationAmountCents = parseInt(metadata.donation_amount_cents ?? "0", 10) || (invoice.amount_paid ?? 0);

      if (!organizationId) break;

      const chargeRef = (invoice as { charge?: string | { id?: string } }).charge;
      const chargeId = typeof chargeRef === "string" ? chargeRef : chargeRef?.id ?? null;

      // @ts-ignore - Supabase client infers types
      await supabase.from("donations").insert({
        amount_cents: donationAmountCents,
        currency: invoice.currency ?? "usd",
        donor_email: invoice.customer_email ?? metadata.donor_email ?? null,
        donor_name: metadata.donor_name ?? null,
        endowment_fund_id: metadata.endowment_fund_id || null,
        stripe_payment_intent_id: (invoice as { payment_intent?: string }).payment_intent ?? null,
        stripe_charge_id: chargeId,
        status: "succeeded",
        organization_id: organizationId,
        campaign_id: campaignId || null,
        user_id: metadata.user_id || null,
        metadata: { invoice: invoice.id, subscription: subId },
      });

      if (campaignId && donationAmountCents > 0) {
        const { data: campaign } = await supabase
          .from("donation_campaigns")
          .select("current_amount_cents")
          .eq("id", campaignId)
          .single();
        if (campaign) {
          const current = Number((campaign as { current_amount_cents: number | null }).current_amount_cents ?? 0);
          await supabase
            .from("donation_campaigns")
            // @ts-expect-error
            .update({
              current_amount_cents: current + donationAmountCents,
              updated_at: new Date().toISOString(),
            })
            .eq("id", campaignId);
        }
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("donor_subscriptions")
        // @ts-ignore
        .update({
          status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      if (!account.id) break;
      const chargesEnabled = account.charges_enabled === true;
      const payoutsEnabled = account.payouts_enabled === true;
      const hasRequirements =
        (account.requirements?.currently_due?.length ?? 0) > 0 ||
        (account.requirements?.eventually_due?.length ?? 0) > 0;
      const detailsSubmitted = account.details_submitted === true;
      // Actions required: set incomplete so nav shows "Complete verification"
      const onboardingCompleted = hasRequirements
        ? false
        : chargesEnabled || payoutsEnabled || detailsSubmitted;
      await supabase
        .from("organizations")
        // @ts-expect-error - Supabase client infers update payload as never in some setups
        .update({
          onboarding_completed: onboardingCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_connect_account_id", account.id);
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  return NextResponse.json({ received: true });
}
