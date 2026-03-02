import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Handles auth redirects from Supabase (email confirmation, password reset, magic link).
 * Exchanges the code for a session and redirects to the appropriate page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const org = searchParams.get("org");
  const frequency = searchParams.get("frequency");

  const inviteOrg = searchParams.get("invite_org");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Missionary invite: redirect to missionary dashboard
      if (inviteOrg) {
        return NextResponse.redirect(`${origin}/dashboard/missionary`);
      }
      // Redirect to give page if org context, else dashboard or custom next
      const redirectTo =
        org
          ? `/give/${encodeURIComponent(org)}${frequency ? `?frequency=${encodeURIComponent(frequency)}` : ""}`
          : next.startsWith("/") ? next : `/${next}`;
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Redirect to login on error
  const loginUrl = org
    ? `${origin}/login?org=${encodeURIComponent(org)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}&error=auth`
    : `${origin}/login?error=auth`;
  return NextResponse.redirect(loginUrl);
}
