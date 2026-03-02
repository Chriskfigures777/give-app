import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createPaymentIntentForDonation } from "@/lib/stripe/create-payment-intent";
import { FUND_REQUESTS_ENABLED } from "@/lib/feature-flags";

/** POST: Create PaymentIntent for donating to a fund request */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FUND_REQUESTS_ENABLED) {
    return NextResponse.json({ error: "Fund requests are not available yet" }, { status: 403 });
  }
  try {
    const { supabase, user } = await requireAuth();
    const { id: fundRequestId } = await params;
    const body = await req.json();
    const { amountCents, donorEmail, donorName, isAnonymous } = body as {
      amountCents: number;
      donorEmail?: string;
      donorName?: string;
      isAnonymous?: boolean;
    };

    if (!amountCents || amountCents < 100) {
      return NextResponse.json({ error: "amountCents (min 100) required" }, { status: 400 });
    }

    const email = donorEmail?.trim();
    if (!email) {
      return NextResponse.json({ error: "donorEmail required" }, { status: 400 });
    }

    const { data: fr } = await supabase
      .from("fund_requests")
      .select("id, requesting_org_id, status")
      .eq("id", fundRequestId)
      .single();

    if (!fr || (fr as { status: string }).status !== "open") {
      return NextResponse.json({ error: "Fund request not found or closed" }, { status: 404 });
    }

    const requestingOrgId = (fr as { requesting_org_id: string }).requesting_org_id;

    const result = await createPaymentIntentForDonation({
      amountCents,
      organizationId: requestingOrgId,
      donorEmail: email,
      donorName: isAnonymous ? "Anonymous" : (donorName?.trim() ?? ""),
      isAnonymous: isAnonymous ?? false,
      userId: user.id,
      fundRequestId,
      supabase,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("Fund request donate error", e);
    const msg = e instanceof Error ? e.message : "Failed to create payment";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
