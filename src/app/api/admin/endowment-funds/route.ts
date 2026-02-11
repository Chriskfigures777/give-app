import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { createConnectAccountForEndowment } from "@/lib/stripe/connect";

/** GET: List all endowment funds (platform admin only). */
export async function GET() {
  try {
    const { supabase } = await requirePlatformAdmin();
    const { data, error } = await supabase
      .from("endowment_funds")
      .select("id, name, description, stripe_connect_account_id, created_at, updated_at")
      .order("name");
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("endowment-funds GET", e);
    return NextResponse.json({ error: "Failed to fetch endowment funds" }, { status: 500 });
  }
}

/** POST: Create endowment fund and optionally create Connect account (platform admin only). */
export async function POST(req: Request) {
  try {
    const { supabase } = await requirePlatformAdmin();
    const body = await req.json();
    const { name, description, createConnectAccount } = body as {
      name: string;
      description?: string | null;
      createConnectAccount?: boolean;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("endowment_funds")
      // @ts-expect-error - Supabase client infers insert payload as never in some setups
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select("id, name, stripe_connect_account_id")
      .single();

    if (insertError) throw insertError;

    const insertedFund = inserted as { id: string; name: string; stripe_connect_account_id?: string | null } | null;
    if (createConnectAccount && insertedFund) {
      const { accountId } = await createConnectAccountForEndowment({
        endowmentFundId: insertedFund.id,
        endowmentName: insertedFund.name,
      });
      const { error: updateError } = await supabase
        .from("endowment_funds")
        // @ts-expect-error - Supabase client infers update payload as never in some setups
        .update({
          stripe_connect_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", insertedFund.id);
      if (updateError) {
        console.error("Failed to save Connect account ID:", updateError);
      } else {
        return NextResponse.json({
          ...insertedFund,
          stripe_connect_account_id: accountId,
        });
      }
    }

    return NextResponse.json(insertedFund ?? inserted);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("endowment-funds POST", e);
    return NextResponse.json({ error: "Failed to create endowment fund" }, { status: 500 });
  }
}
