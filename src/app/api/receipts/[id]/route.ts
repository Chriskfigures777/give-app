import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET: Generate a simple tax receipt for a donation (PDF or HTML). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: donation, error } = await supabase
      .from("donations")
      .select(`
        id,
        amount_cents,
        status,
        created_at,
        donor_email,
        donor_name,
        user_id,
        currency,
        organization_id,
        organizations(name, slug),
        donation_campaigns(name)
      `)
      .eq("id", id)
      .single();

    if (error || !donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    const d = donation as {
      id: string;
      amount_cents: number;
      status: string;
      created_at: string | null;
      donor_email: string | null;
      donor_name: string | null;
      user_id: string | null;
      currency: string;
      organization_id: string | null;
      organizations: { name: string; slug: string } | null;
      donation_campaigns: { name: string } | null;
    };

    if (d.status !== "succeeded") {
      return NextResponse.json({ error: "Donation not completed" }, { status: 400 });
    }

    // Verify access: user_id match or donor_email match
    const isOwner =
      d.user_id === user.id ||
      (d.donor_email && d.donor_email.toLowerCase() === (user.email ?? "").toLowerCase());

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const amount = Number(d.amount_cents) / 100;
    const date = d.created_at
      ? new Date(d.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";
    const orgName = d.organizations?.name ?? "Organization";
    const campaignName = d.donation_campaigns?.name ?? "General";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Receipt - ${orgName}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 24px; color: #1e293b; }
    h1 { font-size: 1.5rem; margin-bottom: 8px; }
    .receipt { border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-top: 24px; }
    .row { display: flex; justify-content: space-between; margin: 12px 0; }
    .label { color: #64748b; }
    .value { font-weight: 600; }
    .amount { font-size: 1.5rem; color: #059669; }
    .footer { margin-top: 32px; font-size: 0.875rem; color: #64748b; }
  </style>
</head>
<body>
  <h1>Tax Receipt</h1>
  <p>Thank you for your donation.</p>
  <div class="receipt">
    <div class="row">
      <span class="label">Organization</span>
      <span class="value">${orgName.replace(/</g, "&lt;")}</span>
    </div>
    <div class="row">
      <span class="label">Fund</span>
      <span class="value">${campaignName.replace(/</g, "&lt;")}</span>
    </div>
    <div class="row">
      <span class="label">Date</span>
      <span class="value">${date}</span>
    </div>
    <div class="row">
      <span class="label">Amount</span>
      <span class="value amount">$${amount.toFixed(2)} USD</span>
    </div>
    <div class="row">
      <span class="label">Receipt ID</span>
      <span class="value" style="font-family: monospace; font-size: 0.875rem;">${d.id}</span>
    </div>
  </div>
  <div class="footer">
    <p>This receipt is for your records. No goods or services were provided in exchange for this donation.</p>
    <p>For tax purposes, please retain this receipt with your records.</p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="receipt-${d.id.slice(0, 8)}.html"`,
      },
    });
  } catch (e) {
    console.error("receipt error", e);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
