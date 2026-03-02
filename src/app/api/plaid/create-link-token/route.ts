import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { CountryCode, Products } from "plaid";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV ?? "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID ?? "",
      "PLAID-SECRET": process.env.PLAID_SECRET ?? "",
    },
  },
});

const plaidClient = new PlaidApi(configuration);

/**
 * Create a Plaid Link token for bank account linking.
 * Uses "auth" product for Dwolla Secure Exchange compatibility.
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

    const body = (await req.json().catch(() => ({}))) as {
      organizationId?: string;
      useCase?: "source" | "recipient";
    };
    const orgId = body.organizationId ?? undefined;

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "Give",
      products: [Products.Auth],
      country_codes: [CountryCode.Us],
      language: "en",
      redirect_uri: process.env.PLAID_REDIRECT_URI,
    });

    return NextResponse.json({
      link_token: response.data.link_token,
    });
  } catch (err) {
    console.error("Plaid link token error:", err);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    );
  }
}
