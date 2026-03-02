import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SPLITS_ENABLED } from "@/lib/feature-flags";

/**
 * GET: List split bank accounts for the organization.
 * POST: Not used - use Plaid exchange route to create.
 */
export async function GET(req: Request) {
  if (!SPLITS_ENABLED) {
    return NextResponse.json({ error: "Splits are not enabled" }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceClient();

    const { data: orgRow } = await serviceSupabase
      .from("organizations")
      .select("id, owner_user_id")
      .eq("id", organizationId)
      .single();

    const org = orgRow as { id: string; owner_user_id: string | null } | null;
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

    const { data: accounts, error } = await serviceSupabase
      .from("split_bank_accounts")
      .select("id, account_name, account_number_last4, is_verified, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("split_bank_accounts fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch accounts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ accounts: accounts ?? [] });
  } catch (err) {
    console.error("split-bank-accounts GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
