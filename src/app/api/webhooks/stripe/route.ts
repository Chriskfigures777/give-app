import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import { ENDOWMENT_SHARE_OF_PLATFORM_FEE } from "@/lib/stripe/constants";
import { SPLITS_ENABLED } from "@/lib/feature-flags";

type SplitEntry = { percentage: number; accountId?: string };
import { sendDonationReceived, sendReceiptAttached, sendOrgDonationReceived, sendPayoutProcessed } from "@/lib/email/send-transactional";

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

  console.log(JSON.stringify({
    type: event.type,
    id: event.id,
    account: (event as { account?: string }).account ?? null,
  }));

  switch (event.type) {
    // ── Platform plan subscription events ──────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Handle platform plan subscriptions separately from donation subscriptions
      if (session.metadata?.type === "platform_plan") {
        const orgId = session.metadata?.org_id;
        const plan = session.metadata?.plan as "website" | "pro" | undefined;
        if (!orgId || !plan) break;

        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription as Stripe.Subscription)?.id ?? null;

        if (!subId) break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        await supabase
          .from("organizations")
          // @ts-ignore
          .update({
            plan,
            plan_status: subscription.status,
            stripe_plan_subscription_id: subscription.id,
            stripe_billing_customer_id:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id,
            plan_trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orgId);

        console.log(`[billing] Org ${orgId} upgraded to ${plan} (sub: ${subscription.id})`);
        break;
      }

      // Donation subscription (existing logic)
      if (session.mode !== "subscription" || !session.subscription) break;

      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription).id;
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

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const meta = subscription.metadata ?? {};

      // Platform plan subscription
      if (meta.type === "platform_plan" && meta.org_id) {
        const newPlan =
          event.type === "customer.subscription.deleted" ? "free" : (meta.plan as "website" | "pro" | undefined) ?? "free";
        const newStatus = event.type === "customer.subscription.deleted" ? "canceled" : subscription.status;

        await supabase
          .from("organizations")
          // @ts-ignore
          .update({
            plan: newPlan,
            plan_status: newStatus === "canceled" ? null : newStatus,
            plan_trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", meta.org_id);

        console.log(`[billing] Org ${meta.org_id} plan → ${newPlan} (${newStatus})`);
        break;
      }

      // Donor donation subscription (existing logic)
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

    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const metadata = pi.metadata ?? {};
      const chargeId =
        typeof pi.latest_charge === "string"
          ? pi.latest_charge
          : (pi.latest_charge as Stripe.Charge)?.id ?? null;

      // --- Payment splitter: check for splits in metadata ---
      let splits: SplitEntry[] = [];
      const rawSplits = metadata.splits;
      const splitMode = (metadata.split_mode as string) ?? "stripe_connect";

      if (typeof rawSplits === "string" && rawSplits) {
        try {
          splits = JSON.parse(rawSplits) as SplitEntry[];
        } catch {
          // ignore parse errors
        }
      }

      if (SPLITS_ENABLED && splits.length > 0 && chargeId && splitMode === "stripe_connect") {
        // Charge landed on form owner's Connect account. application_fee = platform fee only.
        // Transfer peer shares from form owner's Connect account to peer Connect accounts.
        const { data: existingSplit } = await supabase
          .from("split_transfers")
          .select("id")
          .eq("stripe_payment_intent_id", pi.id)
          .maybeSingle();
        if (existingSplit) break;

        const organizationId = metadata.organization_id as string | undefined;
        if (!organizationId) break;

        const { data: orgRow } = await supabase
          .from("organizations")
          .select("stripe_connect_account_id")
          .eq("id", organizationId)
          .single();
        const formOwnerConnectId = (orgRow as { stripe_connect_account_id: string | null } | null)
          ?.stripe_connect_account_id;
        if (!formOwnerConnectId) break;

        const stripeSplits = splits.filter((s) => s.accountId);
        const transferPromises: Promise<unknown>[] = [];

        for (const entry of stripeSplits) {
          const amount = Math.round((entry.percentage! / 100) * pi.amount);
          if (amount >= 1) {
            transferPromises.push(
              stripe.transfers.create(
                {
                  amount,
                  currency: (pi.currency as "usd") ?? "usd",
                  destination: entry.accountId!,
                  transfer_group: pi.id,
                },
                { stripeAccount: formOwnerConnectId }
              )
            );
          }
        }

        if (transferPromises.length > 0) {
          try {
            await Promise.all(transferPromises);
          } catch (transferErr) {
            console.error("[webhook] Split transfer failed:", transferErr);
            throw transferErr;
          }
          await supabase.from("split_transfers").insert({
            stripe_payment_intent_id: pi.id,
          });
        }

        // Create donation record for split payments (receipts, campaign tracking, etc.)
        if (organizationId && pi.id) {
          const { data: existingDonation } = await supabase
            .from("donations")
            .select("id")
            .eq("stripe_payment_intent_id", pi.id)
            .maybeSingle();
          if (!existingDonation) {
            const donationAmountCents =
              parseInt(metadata.donation_amount_cents ?? "0", 10) || pi.amount;
            const receiptToken = randomUUID();
            await supabase.from("donations").insert({
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
              receipt_token: receiptToken,
              metadata: { payment_intent: pi.id, split_mode: "stripe_connect" },
            });
          }
        }
        break;
      }

      // --- Standard donation flow (no splits or bank splits) ---
      const organizationId = metadata.organization_id;
      const applicationFeeCents = parseInt(metadata.application_fee_cents ?? "0", 10);

      if (!organizationId || !pi.id) {
        console.error("Missing organization_id or payment_intent id in metadata");
        break;
      }

      const donationAmountCents =
        parseInt(metadata.donation_amount_cents ?? "0", 10) || pi.amount;

      // Idempotency: donation may already exist (created optimistically on receipt page)
      const { data: existing } = await supabase
        .from("donations")
        .select("id, created_at, receipt_token")
        .eq("stripe_payment_intent_id", pi.id)
        .maybeSingle();

      let insertedDonation: { id: string; created_at: string } | null = null;
      let receiptToken: string;

      if (existing) {
        insertedDonation = existing as { id: string; created_at: string; receipt_token: string | null };
        receiptToken = (existing as { receipt_token: string | null }).receipt_token ?? randomUUID();
      } else {
        receiptToken = randomUUID();
        const { data: inserted, error: insertError } = await supabase
          .from("donations")
          .insert({
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
            receipt_token: receiptToken,
            metadata: { payment_intent: pi.id },
          })
          .select("id, created_at")
          .single();

        if (insertError) {
          console.error("Donation insert failed:", insertError);
          return NextResponse.json(
            { error: "Donation record failed" },
            { status: 500 }
          );
        }
        insertedDonation = inserted as { id: string; created_at: string };
      }

      // Internal splits: create payouts to org's connected bank accounts
      const { data: orgForSplits } = await supabase
        .from("organizations")
        .select("stripe_connect_account_id")
        .eq("id", organizationId)
        .single();
      const connectAccountId = (orgForSplits as { stripe_connect_account_id: string | null } | null)
        ?.stripe_connect_account_id;

      if (connectAccountId) {
        const { data: formRow } = await supabase
          .from("form_customizations")
          .select("internal_splits")
          .eq("organization_id", organizationId)
          .single();
        const internalSplits = (formRow as { internal_splits: { percentage: number; externalAccountId: string }[] | null } | null)
          ?.internal_splits;

        if (Array.isArray(internalSplits) && internalSplits.length > 0) {
          const amountToSplit = Math.max(0, pi.amount - applicationFeeCents);
          if (amountToSplit >= 1) {
            // @ts-ignore - internal_split_payouts may not be in generated types
            const { data: existingPayout } = await supabase
              .from("internal_split_payouts")
              .select("id")
              .eq("stripe_payment_intent_id", pi.id)
              .maybeSingle();
            if (!existingPayout) {
              try {
                for (const s of internalSplits) {
                  const amt = Math.round((s.percentage / 100) * amountToSplit);
                  if (amt >= 1 && s.externalAccountId) {
                    await stripe.payouts.create(
                      {
                        amount: amt,
                        currency: (pi.currency as "usd") ?? "usd",
                        destination: s.externalAccountId,
                      },
                      { stripeAccount: connectAccountId }
                    );
                  }
                }
                // @ts-ignore - internal_split_payouts may not be in generated types
                await supabase.from("internal_split_payouts").insert({
                  stripe_payment_intent_id: pi.id,
                });
              } catch (e) {
                console.error("[webhook] Internal split payouts failed:", e);
              }
            }
          }
        }
      }

      // Transactional emails (after DB write succeeds; fail gracefully)
      if (insertedDonation) {
        const { data: orgRow } = await supabase
          .from("organizations")
          .select("name, owner_user_id")
          .eq("id", organizationId)
          .single();
        const org = orgRow as { name: string; owner_user_id: string | null } | null;
        const orgName = org?.name ?? "Organization";
        const d = insertedDonation as { id: string; created_at: string };
        if (metadata.donor_email) {
          sendDonationReceived({
            supabase,
            donationId: d.id,
            donorEmail: metadata.donor_email,
            donorName: metadata.donor_name || null,
            amountCents: donationAmountCents,
            currency: pi.currency ?? "usd",
            organizationName: orgName,
            createdAt: d.created_at,
          }).catch((e) => console.error("[email] donation_received failed:", e));
          sendReceiptAttached({
            supabase,
            donationId: d.id,
            donorEmail: metadata.donor_email,
            donorName: metadata.donor_name || null,
            amountCents: donationAmountCents,
            currency: pi.currency ?? "usd",
            organizationName: orgName,
            createdAt: d.created_at,
            receiptToken: receiptToken,
          }).catch((e) => console.error("[email] receipt_attached failed:", e));
        }
        if (org?.owner_user_id) {
          const { data: ownerProfile } = await supabase
            .from("user_profiles")
            .select("email")
            .eq("id", org.owner_user_id)
            .single();
          const ownerEmail = (ownerProfile as { email: string | null } | null)?.email;
          if (ownerEmail) {
            sendOrgDonationReceived({
              supabase,
              donationId: d.id,
              organizationId,
              organizationName: orgName,
              amountCents: donationAmountCents,
              currency: pi.currency ?? "usd",
              donorName: metadata.donor_name || null,
              donorEmail: metadata.donor_email || null,
              createdAt: d.created_at,
              adminEmail: ownerEmail,
            }).catch((e) => console.error("[email] org_donation_received failed:", e));
          }
        }
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
            .update({
              current_amount_cents: current + donationAmountCents,
              updated_at: new Date().toISOString(),
            })
            .eq("id", campaignId);
        }
      }

      // Update fund request progress (in-chat fundraising)
      const fundRequestId = metadata.fund_request_id;
      if (fundRequestId && donationAmountCents > 0) {
        const { data: fr } = await supabase
          .from("fund_requests")
          .select("fulfilled_amount_cents, amount_cents, status")
          .eq("id", fundRequestId)
          .single();
        if (fr) {
          const current = Number((fr as { fulfilled_amount_cents: number | null }).fulfilled_amount_cents ?? 0);
          const total = Number((fr as { amount_cents: number | null }).amount_cents ?? 0);
          const newFulfilled = current + donationAmountCents;
          const newStatus = newFulfilled >= total ? "fulfilled" : "open";
          await supabase
            .from("fund_requests")
            .update({
              fulfilled_amount_cents: newFulfilled,
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", fundRequestId);
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

      // Idempotency: skip if already processed (Stripe retries webhooks)
      if (chargeId) {
        const { data: existingByCharge } = await supabase
          .from("donations")
          .select("id")
          .eq("stripe_charge_id", chargeId)
          .maybeSingle();
        if (existingByCharge) break;
      } else {
        const { data: existingByInvoice } = await supabase
          .from("donations")
          .select("id")
          .contains("metadata", { invoice: invoice.id })
          .maybeSingle();
        if (existingByInvoice) break;
      }

      const receiptToken = randomUUID();
      const { data: insertedInvoiceDonation } = await supabase
        .from("donations")
        .insert({
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
          receipt_token: receiptToken,
          metadata: { invoice: invoice.id, subscription: subId },
        })
        .select("id, created_at")
        .single();

        if (insertedInvoiceDonation) {
          const donorEmail = invoice.customer_email ?? metadata.donor_email ?? null;
          const { data: orgRow } = await supabase
            .from("organizations")
            .select("name, owner_user_id")
            .eq("id", organizationId)
            .single();
          const org = orgRow as { name: string; owner_user_id: string | null } | null;
          const orgName = org?.name ?? "Organization";
          const d = insertedInvoiceDonation as { id: string; created_at: string };
          if (donorEmail) {
            sendDonationReceived({
              supabase,
              donationId: d.id,
              donorEmail,
              donorName: metadata.donor_name ?? null,
              amountCents: donationAmountCents,
              currency: invoice.currency ?? "usd",
              organizationName: orgName,
              createdAt: d.created_at,
            }).catch((e) => console.error("[email] donation_received (invoice) failed:", e));
            sendReceiptAttached({
              supabase,
              donationId: d.id,
              donorEmail,
              donorName: metadata.donor_name ?? null,
              amountCents: donationAmountCents,
              currency: invoice.currency ?? "usd",
              organizationName: orgName,
              createdAt: d.created_at,
              receiptToken,
            }).catch((e) => console.error("[email] receipt_attached (invoice) failed:", e));
          }
          if (org?.owner_user_id) {
            const { data: ownerProfile } = await supabase
              .from("user_profiles")
              .select("email")
              .eq("id", org.owner_user_id)
              .single();
            const ownerEmail = (ownerProfile as { email: string | null } | null)?.email;
            if (ownerEmail) {
              sendOrgDonationReceived({
                supabase,
                donationId: d.id,
                organizationId,
                organizationName: orgName,
                amountCents: donationAmountCents,
                currency: invoice.currency ?? "usd",
                donorName: metadata.donor_name ?? null,
                donorEmail: donorEmail,
                createdAt: d.created_at,
                adminEmail: ownerEmail,
              }).catch((e) => console.error("[email] org_donation_received (invoice) failed:", e));
            }
          }
        }

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
            .update({
              current_amount_cents: current + donationAmountCents,
              updated_at: new Date().toISOString(),
            })
            .eq("id", campaignId);
        }
      }
      break;
    }

    case "payout.paid": {
      const payout = event.data.object as Stripe.Payout;
      const connectAccountId = (event as { account?: string }).account;
      if (!connectAccountId || !payout.id) break;

      const { data: orgRow } = await supabase
        .from("organizations")
        .select("id, name, owner_user_id")
        .eq("stripe_connect_account_id", connectAccountId)
        .single();
      if (!orgRow) break;

      const org = orgRow as { id: string; name: string; owner_user_id: string | null };
      const ownerId = org.owner_user_id;
      if (!ownerId) break;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("id", ownerId)
        .single();
      const adminEmail = (profile as { email: string | null } | null)?.email;
      if (!adminEmail) break;

      const amountCents = payout.amount;
      const currency = payout.currency ?? "usd";
      const arrivalDate = payout.arrival_date
        ? new Date(payout.arrival_date * 1000).toISOString()
        : new Date().toISOString();
      const destination = payout.destination
        ? typeof payout.destination === "string"
          ? "Bank account"
          : (payout.destination as { last4?: string })?.last4
            ? `Bank account ****${(payout.destination as { last4: string }).last4}`
            : "Bank account"
        : "Stripe balance";

      sendPayoutProcessed({
        supabase,
        payoutId: payout.id,
        organizationId: org.id,
        organizationName: org.name,
        amountCents,
        currency,
        destination,
        arrivalDate,
        adminEmail,
      }).catch((e) => console.error("[email] payout_processed failed:", e));
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
