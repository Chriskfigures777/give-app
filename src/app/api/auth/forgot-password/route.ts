import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email?: string };

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Always pass redirectTo so Supabase doesn't fall back to Site URL (root).
    // In local dev with no env vars, use localhost so links work.
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.DOMAIN ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");
    // Use /auth/recovery (client page) so we can read tokens from the URL hash.
    // The hash (#access_token=...&type=recovery) is never sent to the server.
    const redirectTo = appUrl
      ? `${appUrl.replace(/\/$/, "")}/auth/callback?next=/update-password`
      : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "If an account exists with that email, you will receive a password reset link.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
