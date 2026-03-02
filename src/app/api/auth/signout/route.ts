import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = req.nextUrl.origin || process.env.DOMAIN || "http://localhost:3000";

  // Redirect via HTML so we can clear Unit White-Label App tokens before navigation.
  // Per Unit docs: unitCustomerToken and unitVerifiedCustomerToken must be cleared on logout.
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Signing out…</title></head>
<body>
<script>
try {
  localStorage.removeItem("unitCustomerToken");
  localStorage.removeItem("unitVerifiedCustomerToken");
} catch (e) {}
window.location.replace(${JSON.stringify(url + "/")});
</script>
<p>Signing out…</p>
</body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
