import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** GET: Generate year-end tax summary PDF for the authenticated user. */
export async function GET(req: NextRequest) {
  try {
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear()), 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startOfYear = `${year}-01-01T00:00:00Z`;
    const endOfYear = `${year}-12-31T23:59:59Z`;

    const { data: byUserId } = await supabase
      .from("donations")
      .select(`
        id,
        amount_cents,
        created_at,
        organizations(name),
        donation_campaigns(name)
      `)
      .eq("user_id", user.id)
      .eq("status", "succeeded")
      .gte("created_at", startOfYear)
      .lte("created_at", endOfYear)
      .order("created_at", { ascending: true });

    const { data: byEmail } = user.email
      ? await supabase
          .from("donations")
          .select(`
            id,
            amount_cents,
            created_at,
            organizations(name),
            donation_campaigns(name)
          `)
          .eq("donor_email", user.email)
          .eq("status", "succeeded")
          .is("user_id", null)
          .gte("created_at", startOfYear)
          .lte("created_at", endOfYear)
          .order("created_at", { ascending: true })
      : { data: [] };

    type Row = {
      id: string;
      amount_cents: number;
      created_at: string | null;
      organizations: { name: string } | null;
      donation_campaigns: { name: string } | null;
    };

    const byUserIdList = (byUserId ?? []) as Row[];
    const byEmailList = (byEmail ?? []) as Row[];
    const seenIds = new Set(byUserIdList.map((d) => d.id));
    const donations = [
      ...byUserIdList,
      ...byEmailList.filter((d) => !seenIds.has(d.id) && seenIds.add(d.id)),
    ].sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
    );

    const totalCents = donations.reduce((sum, d) => sum + Number(d.amount_cents ?? 0), 0);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = pdfDoc.addPage([400, 600]);
    const margin = 50;
    let y = page.getHeight() - margin;

    page.drawText(`${year} Year-End Donation Summary`, {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 28;

    page.drawText(`Prepared for: ${user.email ?? "Donor"}`, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 20;

    page.drawText(`Total donations in ${year}: $${(totalCents / 100).toFixed(2)} USD`, {
      x: margin,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0, 0.4, 0.2),
    });
    y -= 35;

    page.drawText("Donation details", {
      x: margin,
      y,
      size: 11,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 20;

    for (const d of donations) {
      if (y < 80) {
        page = pdfDoc.addPage([400, 600]);
        y = page.getHeight() - margin;
      }

      const date = d.created_at
        ? new Date(d.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "N/A";
      const orgName = d.organizations?.name ?? "Organization";
      const fundName = d.donation_campaigns?.name ?? "General";
      const amount = (Number(d.amount_cents) / 100).toFixed(2);

      page.drawText(`${date} - ${orgName} (${fundName})`, {
        x: margin,
        y,
        size: 9,
        font,
        color: rgb(0.2, 0.2, 0.2),
        maxWidth: 250,
      });
      page.drawText(`$${amount}`, {
        x: margin + 260,
        y,
        size: 9,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 18;
    }

    y -= 25;
    if (y < 100) {
      page = pdfDoc.addPage([400, 600]);
      y = page.getHeight() - margin;
    }

    page.drawText(
      "This summary is for your records. No goods or services were provided in exchange for these donations.",
      {
        x: margin,
        y,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
        maxWidth: 300,
      }
    );
    y -= 20;
    page.drawText("For tax purposes, please retain this summary with your records.", {
      x: margin,
      y,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
      maxWidth: 300,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="donation-summary-${year}.pdf"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("year-end receipt error", e);
    return NextResponse.json(
      { error: "Failed to generate summary", detail: msg },
      { status: 500 }
    );
  }
}
