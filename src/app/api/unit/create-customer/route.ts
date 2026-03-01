import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const UNIT_API_URL = process.env.UNIT_API_URL ?? "https://api.s.unit.sh";

/**
 * Creates a Unit individual customer for the currently authenticated user.
 * Called by the banking application form when a user signs up for banking.
 * Stores the resulting Unit customer ID on the user's profile.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiToken = process.env.UNIT_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ error: "Banking not configured" }, { status: 503 });
  }

  let body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    ssn?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { firstName, lastName, email, phone, dateOfBirth, ssn, street, city, state, postalCode } = body;

  if (!firstName || !lastName || !email || !phone || !dateOfBirth || !ssn || !street || !city || !state || !postalCode) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Clean phone number to digits only
  const phoneDigits = phone.replace(/\D/g, "").slice(-10);

  // Create customer in Unit
  const unitRes = await fetch(`${UNIT_API_URL}/customers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "individualCustomer",
        attributes: {
          ssn,
          fullName: { first: firstName, last: lastName },
          dateOfBirth,
          address: {
            street,
            city,
            state,
            postalCode,
            country: "US",
          },
          email,
          phone: { countryCode: "1", number: phoneDigits },
          // Links this Unit customer to the user's JWT `sub` claim
          jwtSubject: user.id,
        },
      },
    }),
  });

  const unitData = await unitRes.json();

  if (!unitRes.ok) {
    const unitError = unitData?.errors?.[0]?.detail ?? unitData?.errors?.[0]?.title ?? "Failed to create banking account";
    return NextResponse.json({ error: unitError }, { status: 400 });
  }

  const unitCustomerId: string = unitData?.data?.id;

  // Save Unit customer ID to user profile
  const serviceClient = createServiceClient();
  await serviceClient
    .from("user_profiles")
    // @ts-ignore – unit_customer_id not in generated types yet
    .update({ unit_customer_id: unitCustomerId })
    .eq("id", user.id);

  return NextResponse.json({ customerId: unitCustomerId });
}
