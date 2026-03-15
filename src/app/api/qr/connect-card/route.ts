import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/env";

/**
 * GET /api/qr/connect-card?slug=org-slug  (legacy)
 * GET /api/qr/connect-card?id=org-id      (preferred — unique across all orgs)
 * Returns a PNG QR code for the Connect Card page /connect/[orgId]/[orgSlug].
 */
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug")?.trim();
    const id   = req.nextUrl.searchParams.get("id")?.trim();

    if (!slug && !id) {
      return NextResponse.json({ error: "Missing id or slug" }, { status: 400 });
    }

    const baseUrl = env.app.domain().replace(/\/$/, "");
    const supabase = await createClient();

    type OrgResult = { id: string; slug: string };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = id
      ? supabase.from("organizations").select("id, slug").eq("id", id).single()
      : supabase.from("organizations").select("id, slug").eq("slug", slug!).single();

    const { data: orgData } = await query;
    const org = orgData as unknown as OrgResult | null;

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const connectUrl = `${baseUrl}/connect/${org.id}/${org.slug}`;

    const pngBuffer = await QRCode.toBuffer(connectUrl, {
      type: "png",
      width: 512,
      margin: 3,
    });

    return new NextResponse(pngBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="connect-card-${org.slug}-qr.png"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Connect card QR generation error", e);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
