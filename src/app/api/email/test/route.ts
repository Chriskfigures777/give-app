/**
 * Test email endpoint. Sends a simple test email via Resend.
 * Use: curl -X POST http://localhost:3000/api/email/test -H "Content-Type: application/json" -d '{"to":"your@email.com"}'
 */
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = typeof body?.to === "string" && body.to.trim() ? body.to.trim() : null;

    if (!to) {
      return NextResponse.json(
        { error: "Missing 'to' email. Example: {\"to\":\"you@example.com\"}" },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to,
      subject: "Give – Test Email",
      html: `
        <h1>Test Email</h1>
        <p>If you received this, your Resend integration is working.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    });

    if (result.ok) {
      return NextResponse.json({ ok: true, id: result.id, message: "Email sent" });
    }
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
