import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { createConnectAccountForEndowment } from "@/lib/stripe/connect";

/** PATCH: Update endowment fund or create Connect account (platform admin only). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requirePlatformAdmin();
    const body = await req.json();
    const { name, description, createConnectAccount } = body as {
      name?: string;
      description?: string | null;
      createConnectAccount?: boolean;
    };

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description?.trim() || null;

    if (createConnectAccount) {
      const { data: fundData } = await supabase
        .from("endowment_funds")
        .select("id, name, stripe_connect_account_id")
        .eq("id", id)
        .single();

      const fund = fundData as { id: string; name: string; stripe_connect_account_id: string | null } | null;
      if (!fund) {
        return NextResponse.json({ error: "Endowment fund not found" }, { status: 404 });
      }
      if (fund.stripe_connect_account_id) {
        return NextResponse.json(
          { error: "Connect account already exists for this fund" },
          { status: 400 }
        );
      }

      const { accountId } = await createConnectAccountForEndowment({
        endowmentFundId: fund.id,
        endowmentName: (update.name as string) ?? fund.name,
      });
      (update as Record<string, string>).stripe_connect_account_id = accountId;
    }

    const { data, error } = await supabase
      .from("endowment_funds")
      // @ts-expect-error - Supabase client infers update payload as never in some setups
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("endowment-funds PATCH", e);
    return NextResponse.json({ error: "Failed to update endowment fund" }, { status: 500 });
  }
}
