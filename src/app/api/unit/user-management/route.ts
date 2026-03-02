import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Unit User Management Endpoint
 *
 * Unit calls this to notify us when end users are added to or removed from a
 * customer account. Configure this URL in the Unit dashboard under
 * Settings → Callback Endpoints.
 *
 * Verification: Unit sends the shared secret in the Authorization header as
 * `Bearer <UNIT_WEBHOOK_SECRET>`.
 */
export async function POST(req: NextRequest) {
  // Verify the request came from Unit
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = process.env.UNIT_WEBHOOK_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    action?: "ADD" | "REMOVE";
    email?: string;
    customerId?: string;
    customerName?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, email, customerId } = body;

  if (!action || !email) {
    return NextResponse.json({ error: "Missing action or email" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Look up local user by email
  const { data: authUser } = await supabase.auth.admin.listUsers();
  const matchedUser = authUser?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!matchedUser) {
    // User doesn't exist in our system — acknowledge and move on
    return NextResponse.json({ received: true });
  }

  if (action === "ADD") {
    // Store the Unit customer ID on the user's profile so we can reference it later
    await supabase
      .from("user_profiles")
      // @ts-ignore – unit_customer_id column may not be in generated types yet
      .update({ unit_customer_id: customerId ?? null })
      .eq("id", matchedUser.id);
  }

  if (action === "REMOVE") {
    // Clear the Unit customer association
    await supabase
      .from("user_profiles")
      // @ts-ignore
      .update({ unit_customer_id: null })
      .eq("id", matchedUser.id);
  }

  return NextResponse.json({ received: true });
}
