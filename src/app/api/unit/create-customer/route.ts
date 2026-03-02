import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const UNIT_API_URL = process.env.UNIT_API_URL ?? "https://api.s.unit.sh";

const OCCUPATION_OPTIONS = [
  "ArchitectOrEngineer", "BusinessAnalystAccountantOrFinancialAdvisor", "CommunityAndSocialServicesWorker",
  "ConstructionMechanicOrMaintenanceWorker", "Doctor", "Educator", "EntertainmentSportsArtsOrMedia",
  "ExecutiveOrManager", "FarmerFishermanForester", "FoodServiceWorker", "GigWorker",
  "HospitalityOfficeOrAdministrativeSupportWorker", "HouseholdManager", "JanitorHousekeeperLandscaper",
  "Lawyer", "ManufacturingOrProductionWorker", "MilitaryOrPublicSafety",
  "NurseHealthcareTechnicianOrHealthcareSupport", "PersonalCareOrServiceWorker", "PilotDriverOperator",
  "SalesRepresentativeBrokerAgent", "ScientistOrTechnologist", "Student",
] as const;

/**
 * Creates a Unit individual customer via application flow (works with admin token).
 * Unit creates the customer when the application is approved (usually instant in sandbox).
 * Stores the resulting Unit customer ID on the user's profile.
 *
 * Supports cookies (browser) or Authorization: Bearer <supabase-jwt> (curl).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  let user = (await supabase.auth.getUser()).data.user;

  // Fallback: Authorization Bearer (Supabase JWT) for curl
  if (!user) {
    const authHeader = (await headers()).get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (bearerToken) {
      user = (await supabase.auth.getUser(bearerToken)).data.user;
    }
  }

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated. Sign in at /login first, or pass Authorization: Bearer <supabase-jwt>." },
      { status: 401 }
    );
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
    occupation?: string;
  } = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { firstName, lastName, email, phone, dateOfBirth, ssn, street, city, state, postalCode, occupation } = body;

  if (!firstName || !lastName || !email || !phone || !dateOfBirth || !ssn || !street || !city || !state || !postalCode) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const occupationValue = occupation && OCCUPATION_OPTIONS.includes(occupation as (typeof OCCUPATION_OPTIONS)[number])
    ? occupation
    : "ScientistOrTechnologist";

  // Clean phone number to digits only
  const phoneDigits = phone.replace(/\D/g, "").slice(-10);

  // Create application (Unit creates customer when approved - works with admin token)
  const unitRes = await fetch(`${UNIT_API_URL}/applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "individualApplication",
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
          occupation: occupationValue,
          jwtSubject: user.id,
        },
      },
    }),
  });

  const unitData = await unitRes.json();

  if (!unitRes.ok) {
    console.error("[Unit create-customer] status:", unitRes.status, JSON.stringify(unitData, null, 2));
    const unitError =
      unitData?.errors?.[0]?.detail ??
      unitData?.errors?.[0]?.title ??
      unitData?.error ??
      `Unit API error ${unitRes.status}`;
    return NextResponse.json({ error: unitError, unitErrors: unitData?.errors }, { status: 400 });
  }

  // Customer is created when application is approved - extract from relationships
  const unitCustomerId: string | undefined = unitData?.data?.relationships?.customer?.data?.id;
  if (!unitCustomerId) {
    const status = unitData?.data?.attributes?.status;
    return NextResponse.json(
      {
        error: status === "Denied"
          ? "Application was denied"
          : `Application status: ${status ?? "unknown"}. Customer not yet created.`,
        applicationId: unitData?.data?.id,
      },
      { status: 400 }
    );
  }

  // Save Unit customer ID to user profile (create row if missing so banking app can find it)
  const serviceClient = createServiceClient();
  const { data: existing } = await serviceClient
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existing) {
    const { error } = await serviceClient
      .from("user_profiles")
      // @ts-ignore – unit_customer_id not in generated types yet
      .update({ unit_customer_id: unitCustomerId })
      .eq("id", user.id);
    if (error) {
      console.error("[Unit create-customer] Failed to update unit_customer_id", user.id, error);
      return NextResponse.json(
        { error: "Failed to save customer link", detail: error.message },
        { status: 500 }
      );
    }
  } else {
    const { error } = await serviceClient
      .from("user_profiles")
      // @ts-ignore – unit_customer_id not in generated types yet
      .insert({
        id: user.id,
        unit_customer_id: unitCustomerId,
        email: user.email ?? null,
        full_name: (user.user_metadata?.full_name as string) ?? null,
        role: "donor",
      });
    if (error) {
      console.error("[Unit create-customer] Failed to insert user_profile with unit_customer_id", user.id, error);
      return NextResponse.json(
        { error: "Failed to save customer link", detail: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ customerId: unitCustomerId });
}
