import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SPLITS_ENABLED } from "@/lib/feature-flags";

type RouteParams = { params: Promise<{ id: string }> };

async function checkAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  serviceSupabase: ReturnType<typeof createServiceClient>,
  userId: string,
  organizationId: string
): Promise<boolean> {
  const { data: orgRow } = await serviceSupabase
    .from("organizations")
    .select("owner_user_id")
    .eq("id", organizationId)
    .single();

  const org = orgRow as { owner_user_id: string | null } | null;
  if (!org) return false;

  if (org.owner_user_id === userId) return true;

  const { data: admin } = await serviceSupabase
    .from("organization_admins")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!admin;
}

/**
 * DELETE: Remove a split bank account.
 */
export async function DELETE(
  req: Request,
  { params }: RouteParams
) {
  if (!SPLITS_ENABLED) {
    return NextResponse.json({ error: "Splits are not enabled" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();

    const { data: accountRow } = await serviceSupabase
      .from("split_bank_accounts")
      .select("id, organization_id")
      .eq("id", id)
      .single();

    const account = accountRow as { id: string; organization_id: string } | null;
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const hasAccess = await checkAccess(
      supabase,
      serviceSupabase,
      user.id,
      account.organization_id
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await serviceSupabase
      .from("split_bank_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("split_bank_accounts delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("split-bank-accounts DELETE error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
