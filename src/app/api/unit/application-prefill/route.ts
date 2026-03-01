import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Unit Application Prefill Endpoint
 *
 * Unit calls this when a customer starts a new banking application so we can
 * pre-fill KYB data we already have on file. Configure this URL in the Unit
 * dashboard under Settings → Callback Endpoints.
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

  let body: { email?: string; userId?: string; customerId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email;
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Look up user by email
  const { data: authUser } = await supabase.auth.admin.listUsers();
  const matchedUser = authUser?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!matchedUser) {
    // Return empty object — Unit will leave the form blank rather than error
    return NextResponse.json({});
  }

  // Fetch user profile for name and any additional info
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, organization_id")
    .eq("id", matchedUser.id)
    .single();

  // Split full_name into first / last (best-effort)
  const nameParts = (profile?.full_name ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || undefined;

  const prefill: Record<string, unknown> = {};

  if (firstName) {
    prefill.fullName = { first: firstName, ...(lastName ? { last: lastName } : {}) };
  }

  if (matchedUser.email) {
    prefill.email = matchedUser.email;
  }

  if (matchedUser.phone) {
    // Strip non-digits, assume US country code
    const digits = matchedUser.phone.replace(/\D/g, "");
    prefill.phone = { countryCode: "1", number: digits.slice(-10) };
  }

  return NextResponse.json(prefill);
}
