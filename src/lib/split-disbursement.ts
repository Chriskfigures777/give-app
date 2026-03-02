import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { createTransfer, generateTransferIdempotencyKey } from "./dwolla/transfers";
import { isDwollaConfigured } from "./dwolla/client";

export type SplitEntry = {
  percentage: number;
  splitBankAccountId?: string;
  accountId?: string;
};

export type ResolveSplitsResult = {
  splits: SplitEntry[];
  splitMode: "bank_accounts" | "stripe_connect";
  organizationId: string;
} | null;

/**
 * Resolve splits from donation_links, org_embed_cards, or form_customizations.
 * Same resolution order as create-payment-intent.
 */
export async function resolveSplitsForDonation(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  donationLinkId?: string | null,
  embedCardId?: string | null
): Promise<ResolveSplitsResult> {
  if (donationLinkId) {
    const { data: link } = await supabase
      .from("donation_links")
      .select("id, splits, split_mode, organization_id")
      .eq("id", donationLinkId)
      .eq("organization_id", organizationId)
      .single();

    const linkRow = link as {
      id: string;
      splits?: SplitEntry[];
      split_mode?: string;
      organization_id: string;
    } | null;
    if (!linkRow?.splits?.length) return null;
    const mode = (linkRow.split_mode as "bank_accounts" | "stripe_connect") ?? "stripe_connect";
    if (mode !== "bank_accounts") return null;
    return {
      splits: linkRow.splits,
      splitMode: "bank_accounts",
      organizationId: linkRow.organization_id,
    };
  }

  if (embedCardId) {
    const { data: card } = await supabase
      .from("org_embed_cards")
      .select("id, splits, split_mode, organization_id")
      .eq("id", embedCardId)
      .eq("organization_id", organizationId)
      .single();

    const cardRow = card as {
      id: string;
      splits?: SplitEntry[];
      split_mode?: string;
      organization_id: string;
    } | null;
    if (cardRow?.splits?.length) {
      const mode = (cardRow.split_mode as "bank_accounts" | "stripe_connect") ?? "stripe_connect";
      if (mode === "bank_accounts") {
        return {
          splits: cardRow.splits,
          splitMode: "bank_accounts",
          organizationId: cardRow.organization_id,
        };
      }
    }

    const { data: formRow } = await supabase
      .from("form_customizations")
      .select("splits, split_mode")
      .eq("organization_id", organizationId)
      .single();

    const formSplits = (formRow as { splits?: SplitEntry[]; split_mode?: string } | null)?.splits;
    const formMode = (formRow as { split_mode?: string } | null)?.split_mode;
    if (Array.isArray(formSplits) && formSplits.length > 0 && formMode === "bank_accounts") {
      return {
        splits: formSplits,
        splitMode: "bank_accounts",
        organizationId,
      };
    }
    return null;
  }

  const { data: formRow } = await supabase
    .from("form_customizations")
    .select("splits, split_mode")
    .eq("organization_id", organizationId)
    .single();

  const formSplits = (formRow as { splits?: SplitEntry[]; split_mode?: string } | null)?.splits;
  const formMode = (formRow as { split_mode?: string } | null)?.split_mode;
  if (Array.isArray(formSplits) && formSplits.length > 0 && formMode === "bank_accounts") {
    return {
      splits: formSplits,
      splitMode: "bank_accounts",
      organizationId,
    };
  }

  return null;
}

/**
 * Execute Dwolla transfers for splits.
 * Inserts into dwolla_transfers for idempotency, then creates transfers.
 */
export async function executeDwollaSplits(
  supabase: SupabaseClient<Database>,
  params: {
    stripePaymentIntentId: string;
    donationId: string;
    organizationId: string;
    amountCents: number;
    splits: SplitEntry[];
  }
): Promise<void> {
  if (!isDwollaConfigured()) {
    console.error("[split-disbursement] Dwolla is not configured");
    return;
  }

  const { stripePaymentIntentId, donationId, organizationId, amountCents, splits } = params;

  const bankSplits = splits.filter((s) => s.splitBankAccountId && s.percentage > 0);
  if (bankSplits.length === 0) return;

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("dwolla_source_funding_source_url")
    .eq("id", organizationId)
    .single();

  const org = orgRow as { dwolla_source_funding_source_url: string | null } | null;
  const sourceUrl = org?.dwolla_source_funding_source_url;
  if (!sourceUrl) {
    console.error("[split-disbursement] Organization has no Dwolla source funding source");
    return;
  }

  const { data: accountRows } = await supabase
    .from("split_bank_accounts")
    .select("id, dwolla_funding_source_url")
    .in("id", bankSplits.map((s) => s.splitBankAccountId!));

  const accountMap = new Map(
    (accountRows ?? []).map((r) => [
      (r as { id: string; dwolla_funding_source_url: string }).id,
      (r as { id: string; dwolla_funding_source_url: string }).dwolla_funding_source_url,
    ])
  );

  for (const split of bankSplits) {
    const accountId = split.splitBankAccountId;
    if (!accountId) continue;
    const destUrl = accountMap.get(accountId);
    if (!destUrl) continue;

    const amountCentsForSplit = Math.round((split.percentage / 100) * amountCents);
    if (amountCentsForSplit < 1) continue;

    const { data: existing } = await supabase
      .from("dwolla_transfers")
      .select("id")
      .eq("stripe_payment_intent_id", stripePaymentIntentId)
      .eq("split_bank_account_id", accountId)
      .maybeSingle();

    if (existing) continue;

    const { data: inserted } = await supabase
      .from("dwolla_transfers")
      .insert({
        donation_id: donationId,
        stripe_payment_intent_id: stripePaymentIntentId,
        split_bank_account_id: accountId,
        amount_cents: amountCentsForSplit,
        status: "processing",
      })
      .select("id")
      .single();

    if (!inserted) continue;

    try {
      const transferUrl = await createTransfer({
        sourceFundingSourceUrl: sourceUrl,
        destinationFundingSourceUrl: destUrl,
        amountCents: amountCentsForSplit,
        idempotencyKey: generateTransferIdempotencyKey(
          stripePaymentIntentId,
          accountId
        ),
      });

      await supabase
        .from("dwolla_transfers")
        .update({
          status: "completed",
          dwolla_transfer_url: transferUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", stripePaymentIntentId)
        .eq("split_bank_account_id", accountId);
    } catch (err) {
      console.error("[split-disbursement] Dwolla transfer failed:", err);
      await supabase
        .from("dwolla_transfers")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", stripePaymentIntentId)
        .eq("split_bank_account_id", accountId);
    }
  }
}
