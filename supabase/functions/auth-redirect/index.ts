// Supabase Edge Function: redirect Supabase auth callback to Exchange Banking (BankGO).
// Receives GET with ?code=...&target=banking&next=... from Supabase; redirects to BankGO /auth/callback with code and next.
// Do not call exchangeCodeForSession here — BankGO does it so the code is used only once.

const BANKING_APP_URL =
  Deno.env.get("BANKING_APP_URL") ?? "https://excahnge-bankinkg.vercel.app";
const EXCHANGE_APP_URL =
  Deno.env.get("EXCHANGE_APP_URL") ?? "https://give-app78.vercel.app";
const BANKING_CALLBACK_PATH = "/auth/callback";
const DEFAULT_NEXT = "/dashboard";

function safeNextPath(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return DEFAULT_NEXT;
  const trimmed = value.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !/^\/[^/]*:/.test(trimmed)
  ) {
    return trimmed;
  }
  return DEFAULT_NEXT;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  const target = url.searchParams.get("target");
  const next = safeNextPath(url.searchParams.get("next"));

  if (target === "banking" && code && code.length > 0) {
    const base = BANKING_APP_URL.replace(/\/$/, "");
    const redirectUrl = `${base}${BANKING_CALLBACK_PATH}?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
    return Response.redirect(redirectUrl, 302);
  }

  // Not banking: redirect to Exchange app with code so Exchange can exchange it (e.g. /auth/callback?code=...)
  const exchangeBase = EXCHANGE_APP_URL.replace(/\/$/, "");
  if (code && code.length > 0) {
    const exchangeCallback = `${exchangeBase}/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
    return Response.redirect(exchangeCallback, 302);
  }
  return Response.redirect(`${exchangeBase}/login?error=auth`, 302);
});
