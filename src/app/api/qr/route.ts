import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/env";

/**
 * GET /api/qr?slug=org-slug
 * Returns a PNG QR code for the donation page /give/[slug].
 * Optionally requires auth if slug is provided (verifies org exists).
 */
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug")?.trim();
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const baseUrl = env.app.domain().replace(/\/$/, "");
    const giveUrl = `${baseUrl}/give/${slug}`;

    const supabase = await createClient();
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const pngBuffer = await QRCode.toBuffer(giveUrl, {
      type: "png",
      width: 512,
      margin: 3,
    });

    return new NextResponse(pngBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="give-${slug}-qr.png"`,
      },
    });
  } catch (e) {
    console.error("QR generation error", e);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
