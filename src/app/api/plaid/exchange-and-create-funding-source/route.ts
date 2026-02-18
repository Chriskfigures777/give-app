import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  ProcessorTokenCreateRequestProcessorEnum,
} from "plaid";
import {
  createUnverifiedCustomer,
  createFundingSourceFromPlaid,
} from "@/lib/dwolla/funding-sources";
import { isDwollaConfigured } from "@/lib/dwolla/client";

/**
 * Exchange Plaid public token for processor token, create Dwolla funding source,
 * and save to split_bank_accounts (for recipients) or organizations (for source).
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      return NextResponse.json(
        { error: "Plaid is not configured" },
        { status: 503 }
      );
    }

    if (!isDwollaConfigured()) {
      return NextResponse.json(
        { error: "Dwolla is not configured" },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      publicToken: string;
      accountId: string;
      accountName?: string;
      accountMask?: string;
      accountType?: "checking" | "savings";
      organizationId: string;
      useCase: "source" | "recipient";
    };

    const {
      publicToken,
      accountId,
      accountName,
      accountMask,
      accountType = "checking",
      organizationId,
      useCase,
    } = body;

    if (!publicToken || !accountId || !organizationId || !useCase) {
      return NextResponse.json(
        { error: "Missing publicToken, accountId, organizationId, or useCase" },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceClient();

    const { data: orgRow } = await serviceSupabase
      .from("organizations")
      .select("id, name, owner_user_id, dwolla_customer_url, dwolla_source_funding_source_url")
      .eq("id", organizationId)
      .single();

    const org = orgRow as {
      id: string;
      name: string;
      owner_user_id: string | null;
      dwolla_customer_url: string | null;
      dwolla_source_funding_source_url: string | null;
    } | null;

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { data: adminCheck } = await serviceSupabase
      .from("organization_admins")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .maybeSingle();

    const isOwner = org.owner_user_id === user.id;
    if (!isOwner && !adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plaidConfig = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV ?? "sandbox"],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
          "PLAID-SECRET": process.env.PLAID_SECRET,
        },
      },
    });
    const plaidClient = new PlaidApi(plaidConfig);

    const { data: tokenData } = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = tokenData.access_token;

    const { data: processorData } = await plaidClient.processorTokenCreate({
      access_token: accessToken,
      account_id: accountId,
      processor: ProcessorTokenCreateRequestProcessorEnum.Dwolla,
    });
    const processorToken = processorData.processor_token;

    const last4 = accountMask ?? accountId.slice(-4);
    const displayName = accountName ?? `Bank ****${last4}`;

    if (useCase === "source") {
      let customerUrl = org.dwolla_customer_url;
      if (!customerUrl) {
        const { data: profile } = await serviceSupabase
          .from("user_profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        const profileRow = profile as { full_name?: string; email?: string } | null;
        const nameParts = (profileRow?.full_name ?? "Org").trim().split(/\s+/);
        const firstName = nameParts[0] ?? "Org";
        const lastName = nameParts.slice(1).join(" ") || org.name;
        customerUrl = await createUnverifiedCustomer({
          firstName,
          lastName,
          email: profileRow?.email ?? `org-${org.id}@give.example.com`,
        });
        await serviceSupabase
          .from("organizations")
          .update({
            dwolla_customer_url: customerUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", organizationId);
      }

      const customerId = customerUrl.split("/").pop();
      if (!customerId) throw new Error("Invalid customer URL");

      const fundingSourceUrl = await createFundingSourceFromPlaid({
        processorToken,
        customerId,
        fundingSourceName: `${org.name} - Source`,
        bankAccountType: accountType,
      });

      await serviceSupabase
        .from("organizations")
        .update({
          dwolla_source_funding_source_url: fundingSourceUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizationId);

      return NextResponse.json({
        success: true,
        useCase: "source",
        fundingSourceUrl,
      });
    }

    if (useCase === "recipient") {
      const customerUrl = await createUnverifiedCustomer({
        firstName: "Split",
        lastName: displayName,
        email: `recipient-${org.id}-${Date.now()}@give.example.com`,
      });

      const customerId = customerUrl.split("/").pop();
      if (!customerId) throw new Error("Invalid customer URL");

      const fundingSourceUrl = await createFundingSourceFromPlaid({
        processorToken,
        customerId,
        fundingSourceName: displayName,
        bankAccountType: accountType,
      });

      const { data: inserted } = await serviceSupabase
        .from("split_bank_accounts")
        .insert({
          organization_id: organizationId,
          dwolla_customer_url: customerUrl,
          dwolla_funding_source_url: fundingSourceUrl,
          plaid_account_id: accountId,
          account_name: displayName,
          account_number_last4: last4,
          is_verified: true,
        })
        .select("id")
        .single();

      return NextResponse.json({
        success: true,
        useCase: "recipient",
        splitBankAccountId: (inserted as { id: string })?.id,
        fundingSourceUrl,
      });
    }

    return NextResponse.json(
      { error: "Invalid useCase" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Plaid exchange error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create funding source" },
      { status: 500 }
    );
  }
}
