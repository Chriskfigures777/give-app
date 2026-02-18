import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { requireOrgAdmin } from "@/lib/auth";

/**
 * GET: List external bank accounts for the org's Stripe Connect account.
 * Used for internal splits configuration.
 */
export async function GET(req: Request) {
  try {
    const { supabase, profile, organizationId: orgIdFromAuth } = await requireOrgAdmin();
    const organizationId = orgIdFromAuth ?? profile?.organization_id ?? profile?.preferred_organization_id;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_connect_account_id")
      .eq("id", organizationId)
      .single();

    const connectAccountId = (org as { stripe_connect_account_id: string | null } | null)
      ?.stripe_connect_account_id;
    if (!connectAccountId) {
      return NextResponse.json(
        { error: "Organization has no Stripe Connect account. Complete verification first." },
        { status: 400 }
      );
    }

    // Fetch all external accounts (paginate to get all); include both bank_account and card, filter to bank_account
    const allAccounts: { id: string; object: string; bank_name?: string; last4?: string }[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    while (hasMore) {
      const resp = await stripe.accounts.listExternalAccounts(connectAccountId, {
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter }),
      });
      allAccounts.push(...(resp.data as { id: string; object: string; bank_name?: string; last4?: string }[]));
      hasMore = resp.has_more;
      if (hasMore && resp.data.length > 0) {
        const last = resp.data[resp.data.length - 1] as { id: string };
        startingAfter = last.id;
      } else {
        break;
      }
    }

    const bankAccounts = allAccounts.filter((a) => a.object === "bank_account");
    const accounts = bankAccounts.map((a) => ({
      id: a.id,
      bankName: a.bank_name ?? "Bank",
      last4: a.last4 ?? "****",
      label: `${a.bank_name ?? "Bank"} ****${a.last4 ?? "****"}`,
    }));

    const { data: formRow } = await supabase
      .from("form_customizations")
      .select("internal_splits")
      .eq("organization_id", organizationId)
      .single();

    const internalSplits = (formRow as { internal_splits: { percentage: number; externalAccountId: string }[] | null } | null)
      ?.internal_splits ?? null;

    return NextResponse.json({ accounts, internalSplits });
  } catch (e) {
    console.error("external-accounts GET error", e);
    return NextResponse.json({ error: "Failed to load bank accounts" }, { status: 500 });
  }
}

/**
 * POST: Add a bank account to the org's Stripe Connect account.
 * Accepts a bank account token (btok_xxx) created client-side via Stripe.js.
 * Used when the embedded Manage billing form doesn't allow adding more accounts.
 */
export async function POST(req: Request) {
  try {
    const { supabase, profile, organizationId: orgIdFromAuth } = await requireOrgAdmin();
    const organizationId = orgIdFromAuth ?? profile?.organization_id ?? profile?.preferred_organization_id;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    let body: { bankAccountToken?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const token = body.bankAccountToken;
    if (!token || typeof token !== "string" || !token.startsWith("btok_")) {
      return NextResponse.json(
        { error: "Missing or invalid bank account token. Use the form to add a bank account." },
        { status: 400 }
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_connect_account_id")
      .eq("id", organizationId)
      .single();

    const connectAccountId = (org as { stripe_connect_account_id: string | null } | null)
      ?.stripe_connect_account_id;
    if (!connectAccountId) {
      return NextResponse.json(
        { error: "Organization has no Stripe Connect account. Complete verification first." },
        { status: 400 }
      );
    }

    // Stripe requires default_for_currency: true when adding. Set the new account as default for its currency.
    // With "Collect multiple external accounts per currency" enabled, existing accounts remain; the new one becomes default.
    await stripe.accounts.createExternalAccount(connectAccountId, {
      external_account: token,
      default_for_currency: true,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("external-accounts POST error", e);
    const msg = e instanceof Error ? e.message : "Failed to add bank account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
