import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** GET: Generate a simple tax receipt for a donation (PDF or HTML). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const format = req.nextUrl.searchParams.get("format") ?? "html";
    const token = req.nextUrl.searchParams.get("token");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        receipt_token,
        currency,
        organization_id,
        metadata,
        organizations(name, slug),
        donation_campaigns(name)
      `)
      .eq("id", id)
      .single();

    if (error || !donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    type SplitBreakdownEntry = {
      organization_id: string | null;
      organization_name: string;
      percentage: number;
      amount_cents: number;
    };

    const d = donation as {
      id: string;
      amount_cents: number;
      status: string;
      created_at: string | null;
      donor_email: string | null;
      donor_name: string | null;
      user_id: string | null;
      receipt_token: string | null;
      currency: string;
      organization_id: string | null;
      metadata: Record<string, unknown> | null;
      organizations: { name: string; slug: string } | null;
      donation_campaigns: { name: string } | null;
    };

    if (d.status !== "succeeded") {
      return NextResponse.json({ error: "Donation not completed" }, { status: 400 });
    }

    const isOwnerByAuth =
      user &&
      (d.user_id === user.id ||
        (d.donor_email && d.donor_email.toLowerCase() === (user.email ?? "").toLowerCase()));
    const isOwnerByToken = token && d.receipt_token && token === d.receipt_token;
    const isLegacyNoToken = !d.receipt_token && !user;
    if (!isOwnerByAuth && !isOwnerByToken && !isLegacyNoToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const meta = d.metadata as Record<string, unknown> | null;
    const splitsBreakdown =
      meta?.split_mode === "stripe_connect" && Array.isArray(meta?.splits_breakdown)
        ? (meta.splits_breakdown as SplitBreakdownEntry[])
        : null;

    if (format === "pdf") {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      // Expand page height if there are split rows
      const extraHeight = splitsBreakdown ? splitsBreakdown.length * 22 + 30 : 0;
      const page = pdfDoc.addPage([400, 500 + extraHeight]);
      const margin = 50;
      let y = page.getHeight() - margin;

      page.drawText("Tax Receipt", {
        x: margin,
        y,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 30;

      const rows: [string, string][] = [
        ["Organization", orgName],
        ["Fund", campaignName],
        ["Date", date],
        ["Total Amount", `$${amount.toFixed(2)} USD`],
      ];

      for (const [label, value] of rows) {
        page.drawText(`${label}:`, {
          x: margin,
          y,
          size: 11,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        page.drawText(value, {
          x: margin + 120,
          y,
          size: 11,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= 22;
      }

      if (splitsBreakdown && splitsBreakdown.length > 0) {
        y -= 10;
        page.drawText("Split Allocation:", {
          x: margin,
          y,
          size: 10,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        y -= 18;
        for (const entry of splitsBreakdown) {
          const label = `  ${entry.percentage}%  ${entry.organization_name}`;
          const value = `$${(entry.amount_cents / 100).toFixed(2)}`;
          page.drawText(label, {
            x: margin,
            y,
            size: 10,
            font,
            color: rgb(0.2, 0.2, 0.2),
            maxWidth: 220,
          });
          page.drawText(value, {
            x: margin + 240,
            y,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
          y -= 20;
        }
      }

      y -= 10;
      page.drawText(`Receipt ID: ${d.id}`, {
        x: margin,
        y,
        size: 9,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 24;

      page.drawText(
        "This receipt is for your records. No goods or services were provided in exchange for this donation.",
        {
          x: margin,
          y,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
          maxWidth: 300,
        }
      );
      y -= 30;
      page.drawText("For tax purposes, please retain this receipt with your records.", {
        x: margin,
        y,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
        maxWidth: 300,
      });

      const pdfBytes = await pdfDoc.save();

      return new NextResponse(pdfBytes as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="receipt-${d.id.slice(0, 8)}.pdf"`,
        },
      });
    }

    const splitRowsHtml = splitsBreakdown
      ? `
    <div class="split-section">
      <div class="split-header">Split Allocation</div>
      ${splitsBreakdown
        .map(
          (entry) => `
      <div class="split-row">
        <span class="split-pct">${entry.percentage}%</span>
        <span class="split-org">${entry.organization_name.replace(/</g, "&lt;")}</span>
        <span class="split-amt">$${(entry.amount_cents / 100).toFixed(2)}</span>
      </div>`
        )
        .join("")}
    </div>`
      : "";

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
    .split-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .split-header { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; }
    .split-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 0.875rem; }
    .split-pct { background: #d1fae5; color: #065f46; border-radius: 9999px; padding: 2px 8px; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }
    .split-org { flex: 1; color: #334155; }
    .split-amt { font-weight: 600; color: #1e293b; flex-shrink: 0; }
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
      <span class="label">Total Amount</span>
      <span class="value amount">$${amount.toFixed(2)} USD</span>
    </div>
    ${splitRowsHtml}
    <div class="row" style="margin-top: 16px;">
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
    const msg =
      e instanceof Error ? e.message : typeof e === "string" ? e : String(e ?? "Unknown error");
    console.error("receipt error", e);
    return NextResponse.json(
      { error: "Failed to generate receipt", detail: msg },
      { status: 500 }
    );
  }
}
