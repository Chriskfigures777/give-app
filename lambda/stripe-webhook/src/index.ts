import { randomUUID } from "crypto";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendDonationEmails, sendOrgDonationEmail, sendPayoutEmail } from "./email";

/** 30% of platform fee goes to endowment fund. */
const ENDOWMENT_SHARE_OF_PLATFORM_FEE = 0.3;

/** Webhook secrets – try each until one verifies (supports Connect + account webhooks on same URL). */
const webhookSecrets = [
  process.env.STRIPE_WEBHOOK_SECRET,
  process.env.STRIPE_WEBHOOK_SECRET_1,
  process.env.STRIPE_WEBHOOK_SECRET_2,
].filter((s): s is string => !!s);

/** When true, skip signature verification. Use only for testing with Stripe CLI or test mode. */
const skipVerification =
  process.env.SKIP_WEBHOOK_VERIFICATION === "true" || process.env.SKIP_WEBHOOK_VERIFICATION === "1";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is required");
  return new Stripe(key, { apiVersion: "2026-01-28.clover", typescript: true });
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  return createClient(url, key);
}

function jsonResponse(statusCode: number, body: object): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

/** Connect account ID from event – present when event is from a Connect webhook. */
function getConnectAccountId(ev: Stripe.Event): string | null {
  return (ev as Stripe.Event & { account?: string }).account ?? null;
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // Entry log – if you don't see this in CloudWatch, Lambda isn't being invoked
  console.log("[stripe-webhook] invoked", {
    hasBody: !!event?.body,
    bodyLen: typeof event?.body === "string" ? event.body.length : 0,
    hasSig: !!(event?.headers?.["stripe-signature"] ?? event?.headers?.["Stripe-Signature"]),
  });

  if (webhookSecrets.length === 0 && !skipVerification) {
    console.error("Stripe webhook secret not set");
    return jsonResponse(500, { error: "Webhook not configured" });
  }

  let body: string;
  if (event.isBase64Encoded && event.body) {
    body = Buffer.from(event.body, "base64").toString("utf-8");
  } else {
    body = event.body ?? "";
  }

  const stripe = getStripe();
  let stripeEvent: Stripe.Event | undefined;

  if (skipVerification) {
    try {
      stripeEvent = JSON.parse(body) as Stripe.Event;
      if (!stripeEvent?.type || !stripeEvent?.data?.object) {
        return jsonResponse(400, { error: "Invalid event payload" });
      }
      console.warn("[SKIP_WEBHOOK_VERIFICATION] Signature verification skipped – testing only");
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }
  } else {
    const sig = event.headers["stripe-signature"] ?? event.headers["Stripe-Signature"];
    if (!sig) {
      return jsonResponse(400, { error: "No signature" });
    }
    for (const secret of webhookSecrets) {
      try {
        stripeEvent = stripe.webhooks.constructEvent(body, sig, secret);
        break;
      } catch {
        /* try next secret */
      }
    }
    if (!stripeEvent) {
      console.error("Webhook signature verification failed (tried all secrets)");
      return jsonResponse(400, { error: "Invalid signature" });
    }
  }

  const supabase = getSupabase();
  if (!stripeEvent) return jsonResponse(500, { error: "Event not parsed" });

  const connectAccountId = getConnectAccountId(stripeEvent);
  console.log(JSON.stringify({
    type: stripeEvent.type,
    id: stripeEvent.id,
    connectAccount: connectAccountId,
  }));

  try {
    switch (stripeEvent.type) {
      case "payment_intent.succeeded": {
        const pi = stripeEvent.data.object as Stripe.PaymentIntent;
        const metadata = pi.metadata ?? {};
        const chargeId =
          typeof pi.latest_charge === "string"
            ? pi.latest_charge
            : (pi.latest_charge as Stripe.Charge)?.id ?? null;

        let splits: { percentage: number; accountId: string }[] = [];
        const rawSplits = metadata.splits;
        if (typeof rawSplits === "string" && rawSplits) {
          try {
            splits = JSON.parse(rawSplits) as { percentage: number; accountId: string }[];
          } catch {
            /* ignore */
          }
        }

        if (splits.length === 0) {
          try {
            const searchResult = await stripe.invoices.search(
              { query: `payment_intent:"${pi.id}"` },
              connectAccountId ? { stripeAccount: connectAccountId } : undefined
            );
            for (const inv of searchResult.data) {
            const lines = inv.lines?.data ?? [];
            for (const line of lines) {
              const lineItem = line as {
                price?: { product?: string | Stripe.Product };
                pricing?: { price_details?: { product?: string } };
              };
              const productId =
                typeof lineItem.price?.product === "string"
                  ? lineItem.price.product
                  : (lineItem.price?.product as Stripe.Product)?.id ??
                    (typeof lineItem.pricing?.price_details?.product === "string"
                      ? lineItem.pricing.price_details.product
                      : null);
              if (!productId) continue;
              const product = await stripe.products.retrieve(
                productId,
                connectAccountId ? { stripeAccount: connectAccountId } : undefined
              );
              const productSplits = product.metadata?.splits;
              if (typeof productSplits === "string" && productSplits) {
                try {
                  splits = JSON.parse(productSplits) as { percentage: number; accountId: string }[];
                  break;
                } catch {
                  /* ignore */
                }
              }
            }
            if (splits.length > 0) break;
          }
          } catch (invErr) {
            console.warn("Invoice search skipped:", invErr instanceof Error ? invErr.message : invErr);
          }
        }

        if (splits.length > 0 && chargeId) {
          const { data: existingSplit } = await supabase
            .from("split_transfers")
            .select("id")
            .eq("stripe_payment_intent_id", pi.id)
            .maybeSingle();
          if (!existingSplit) {
            const organizationId = metadata.organization_id as string | undefined;
            if (!organizationId) break;

            const { data: orgRow } = await supabase
              .from("organizations")
              .select("stripe_connect_account_id")
              .eq("id", organizationId)
              .single();
            const formOwnerConnectId =
              connectAccountId ??
              (orgRow as { stripe_connect_account_id: string | null } | null)?.stripe_connect_account_id;
            if (!formOwnerConnectId) break;

            // Transfer peer shares from form owner's Connect account to peer Connect accounts
            const stripeSplits = splits.filter((s) => s.accountId);
            const transferPromises: Promise<unknown>[] = [];
            for (const entry of stripeSplits) {
              const amount = Math.round((entry.percentage / 100) * pi.amount);
              if (amount >= 1) {
                transferPromises.push(
                  stripe.transfers.create(
                    {
                      amount,
                      currency: (pi.currency as "usd") ?? "usd",
                      destination: entry.accountId,
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
              await supabase.from("split_transfers").insert({ stripe_payment_intent_id: pi.id });
            }
          }

          // Create donation record for split payments
          const splitOrgId = metadata.organization_id as string | undefined;
          if (splitOrgId && pi.id) {
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
                organization_id: splitOrgId,
                campaign_id: metadata.campaign_id || null,
                user_id: metadata.user_id || null,
                receipt_token: receiptToken,
                metadata: { payment_intent: pi.id, split_mode: "stripe_connect" },
              });
            }
          }
          break;
        }

        const organizationId = metadata.organization_id;
        const applicationFeeCents = parseInt(metadata.application_fee_cents ?? "0", 10);

        if (!organizationId || !pi.id) {
          console.error("Missing organization_id or payment_intent id in metadata");
          break;
        }

        const donationAmountCents =
          parseInt(metadata.donation_amount_cents ?? "0", 10) || pi.amount;

        const { data: existing } = await supabase
          .from("donations")
          .select("id")
          .eq("stripe_payment_intent_id", pi.id)
          .maybeSingle();
        if (existing) break;

        const receiptToken = randomUUID();
        const { data: insertedDonation, error: insertError } = await supabase
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
          // If org_id invalid (e.g. test fixture), acknowledge to avoid Stripe retries
          const code = insertError.code ?? "";
          if (code === "23503" || String(insertError.message).includes("foreign key")) {
            console.warn("Skipping donation insert (invalid org/campaign reference, likely test event)");
            break;
          }
          return jsonResponse(500, { error: "Donation record failed" });
        }

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
            await sendDonationEmails({
              supabase,
              donationId: d.id,
              donorEmail: metadata.donor_email,
              donorName: metadata.donor_name || null,
              amountCents: donationAmountCents,
              currency: pi.currency ?? "usd",
              orgName,
              createdAt: d.created_at,
              receiptToken,
            }).catch((e) => console.error("[email] donation emails failed:", e));
            await new Promise((r) => setTimeout(r, 600));
          }
          if (org?.owner_user_id) {
            const { data: ownerProfile } = await supabase
              .from("user_profiles")
              .select("email")
              .eq("id", org.owner_user_id)
              .single();
            const ownerEmail = (ownerProfile as { email: string | null } | null)?.email;
            if (ownerEmail) {
              await sendOrgDonationEmail({
                supabase,
                donationId: d.id,
                orgName,
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

        const donorUserId = metadata.user_id;
        if (donorUserId && organizationId) {
          await supabase.from("donor_saved_organizations").upsert(
            { user_id: donorUserId, organization_id: organizationId },
            { onConflict: "user_id,organization_id" }
          );
        }

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

        const endowmentFundId = metadata.endowment_fund_id;
        if (applicationFeeCents > 0 && endowmentFundId) {
          const { data: fundRow } = await supabase
            .from("endowment_funds")
            .select("id, stripe_connect_account_id")
            .eq("id", endowmentFundId)
            .single();

          const fund = fundRow as { id: string; stripe_connect_account_id: string | null } | null;
          if (fund?.stripe_connect_account_id) {
            const endowmentCents = Math.round(applicationFeeCents * ENDOWMENT_SHARE_OF_PLATFORM_FEE);
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
              }
            }
          }
        }

        // Internal splits: when payment succeeds, send funds to org's configured bank accounts
        const { data: orgForSplits } = await supabase
          .from("organizations")
          .select("stripe_connect_account_id")
          .eq("id", organizationId)
          .single();
        const connectId = connectAccountId ?? (orgForSplits as { stripe_connect_account_id: string | null } | null)?.stripe_connect_account_id ?? null;
        if (connectId) {
          const { data: formRow } = await supabase
            .from("form_customizations")
            .select("internal_splits")
            .eq("organization_id", organizationId)
            .single();
          const internalSplits = (formRow as { internal_splits: { percentage: number; externalAccountId: string }[] | null } | null)?.internal_splits;
          if (Array.isArray(internalSplits) && internalSplits.length > 0) {
            const totalPct = internalSplits.reduce((s, e) => s + (e.percentage ?? 0), 0);
            if (totalPct === 100) {
              const { data: existingPayout } = await supabase
                .from("internal_split_payouts")
                .select("id")
                .eq("stripe_payment_intent_id", pi.id)
                .maybeSingle();
              if (!existingPayout) {
                try {
                  for (const split of internalSplits) {
                    const amountCents = Math.round((split.percentage / 100) * donationAmountCents);
                    if (amountCents < 1) continue;
                    await stripe.payouts.create(
                      {
                        amount: amountCents,
                        currency: (pi.currency as "usd") ?? "usd",
                        destination: split.externalAccountId,
                        method: "standard",
                      },
                      { stripeAccount: connectId }
                    );
                  }
                  await supabase.from("internal_split_payouts").insert({
                    stripe_payment_intent_id: pi.id,
                  });
                } catch (payoutErr) {
                  console.error("Internal split payouts failed (funds may be pending):", payoutErr instanceof Error ? payoutErr.message : payoutErr);
                }
              }
            }
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = stripeEvent.data.object as Stripe.PaymentIntent;
        await supabase
          .from("donations")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("stripe_payment_intent_id", pi.id);
        break;
      }

      case "checkout.session.completed": {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subAccountId = getConnectAccountId(stripeEvent);
        const subscription = await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price"],
          ...(subAccountId && { stripeAccount: subAccountId }),
        });
        const metadata = subscription.metadata ?? session.metadata ?? {};

        const organizationId = metadata.organization_id;
        const userId = metadata.user_id;
        if (!organizationId || !userId) break;

        const item = subscription.items.data[0];
        const amountCents = item?.price?.unit_amount ?? 0;
        const interval = (item?.price?.recurring?.interval as "month" | "year") ?? "month";

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

        await supabase.from("donor_saved_organizations").upsert(
          { user_id: userId, organization_id: organizationId },
          { onConflict: "user_id,organization_id" }
        );
        break;
      }

      case "invoice.paid": {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const subRef = (invoice as { subscription?: string | { id: string } }).subscription;
        if (!subRef) break;

        const subId = typeof subRef === "string" ? subRef : subRef.id;
        const invAccountId = getConnectAccountId(stripeEvent);
        const subscription = await stripe.subscriptions.retrieve(subId, {
          ...(invAccountId && { stripeAccount: invAccountId }),
        });
        const metadata = subscription.metadata ?? {};

        const organizationId = metadata.organization_id;
        const campaignId = metadata.campaign_id;
        const donationAmountCents = parseInt(metadata.donation_amount_cents ?? "0", 10) || (invoice.amount_paid ?? 0);

        if (!organizationId) break;

        const chargeRef = (invoice as { charge?: string | { id?: string } }).charge;
        const chargeId = typeof chargeRef === "string" ? chargeRef : chargeRef?.id ?? null;

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

        const receiptTokenInvoice = randomUUID();
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
            receipt_token: receiptTokenInvoice,
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
            await sendDonationEmails({
              supabase,
              donationId: d.id,
              donorEmail,
              donorName: metadata.donor_name ?? null,
              amountCents: donationAmountCents,
              currency: invoice.currency ?? "usd",
              orgName,
              createdAt: d.created_at,
              receiptToken: receiptTokenInvoice,
            }).catch((e) => console.error("[email] donation emails (invoice) failed:", e));
          }
          if (org?.owner_user_id) {
            const { data: ownerProfile } = await supabase
              .from("user_profiles")
              .select("email")
              .eq("id", org.owner_user_id)
              .single();
            const ownerEmail = (ownerProfile as { email: string | null } | null)?.email;
            if (ownerEmail) {
              await sendOrgDonationEmail({
                supabase,
                donationId: d.id,
                orgName,
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

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await supabase
          .from("donor_subscriptions")
          .update({ status: subscription.status, updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "payout.paid": {
        const payout = stripeEvent.data.object as Stripe.Payout;
        const payoutConnectId = getConnectAccountId(stripeEvent);
        if (!payoutConnectId || !payout.id) break;

        const { data: orgRow } = await supabase
          .from("organizations")
          .select("id, name, owner_user_id")
          .eq("stripe_connect_account_id", payoutConnectId)
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
        const dest = payout.destination;
        const destination = dest
          ? typeof dest === "string"
            ? "Bank account"
            : (dest as { last4?: string })?.last4
              ? `Bank account ****${(dest as { last4: string }).last4}`
              : "Bank account"
          : "Stripe balance";

        await sendPayoutEmail({
          supabase,
          payoutId: payout.id,
          orgId: org.id,
          orgName: org.name,
          amountCents,
          currency,
          destination,
          arrivalDate,
          adminEmail,
        }).catch((e) => console.error("[email] payout_processed failed:", e));
        break;
      }

      case "account.updated": {
        const account = stripeEvent.data.object as Stripe.Account;
        if (!account.id) break;
        const chargesEnabled = account.charges_enabled === true;
        const payoutsEnabled = account.payouts_enabled === true;
        const hasRequirements =
          (account.requirements?.currently_due?.length ?? 0) > 0 ||
          (account.requirements?.eventually_due?.length ?? 0) > 0;
        const detailsSubmitted = account.details_submitted === true;
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
        break;
    }
  } catch (err) {
    console.error("Webhook processing error:", err instanceof Error ? err.message : err, err instanceof Error ? err.stack : "");
    return jsonResponse(500, { error: "Processing failed" });
  }

  return jsonResponse(200, { received: true });
}
