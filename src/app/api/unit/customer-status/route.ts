import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns whether the current user already has a Unit customer account.
 * The banking page calls this on load to decide whether to show the
 * application form or load the Unit white-label app directly.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ hasCustomer: false, authenticated: false });
  }

  // @ts-ignore – unit_customer_id not in generated types yet
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("unit_customer_id")
    .eq("id", user.id)
    .single();

  // @ts-ignore
  const hasCustomer = !!profile?.unit_customer_id;

  return NextResponse.json({ hasCustomer, authenticated: true });
}
