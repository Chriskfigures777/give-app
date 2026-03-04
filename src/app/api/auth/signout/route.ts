import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function signOutHtml(origin: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Signing out…</title></head>
<body>
<script>
try {
  localStorage.removeItem("unitCustomerToken");
  localStorage.removeItem("unitVerifiedCustomerToken");
} catch (e) {}
window.location.replace(${JSON.stringify(origin + "/")});
</script>
<p>Signing out…</p>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = req.nextUrl.origin || process.env.DOMAIN || "http://localhost:3000";

  // Redirect via HTML so we can clear Unit White-Label App tokens before navigation.
  // Per Unit docs: unitCustomerToken and unitVerifiedCustomerToken must be cleared on logout.
  return new NextResponse(signOutHtml(origin), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

/** GET: Used as Auth0 logout returnTo. Auth0 redirects here after clearing its session. */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = req.nextUrl.origin || process.env.DOMAIN || "http://localhost:3000";

  return new NextResponse(signOutHtml(origin), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
