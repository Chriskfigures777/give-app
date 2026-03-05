# AI Prompt: Create Supabase Edge Function for Banking App Redirect

Use this prompt in the **Exchange** codebase (or in a context where you can see both the Exchange and BankGO codebases). The goal is to add a **Supabase Edge Function** so that when a user signs up or signs in on Exchange after coming from the banking app, they are redirected back to the banking app with a valid auth code and the process is finished there.

---

## 1. Reference the BankGO codebase

Before implementing, read these files from the **BankGO** (Exchange Banking) codebase to match behavior:

- **`app/auth/callback/route.ts`** — BankGO's auth callback. It expects a GET request with query params:
  - `code` (required): Supabase auth code; BankGO calls `exchangeCodeForSession(code)` and then redirects.
  - `next` (optional): Relative path to redirect after login (e.g. `/dashboard` or `/dashboard/banking`). Only relative paths are allowed (safe redirect).
- **`lib/config.ts`** — Defines `BANKING_APP_URL` (e.g. `https://excahnge-bankinkg.vercel.app`) and `EXCHANGE_APP_URL`.
- **`lib/safe-redirect.ts`** — Helpers `safeRedirectPath` and `safeNextPath`; only relative paths are accepted to avoid open redirects.

BankGO does **not** consume the code on Exchange's side; it only consumes the code on the banking app's `/auth/callback`. So the Edge Function must **redirect the user** to BankGO's callback URL **with the same `code`** (and optional `next`) in the query string. Do not call `exchangeCodeForSession` in the Edge Function; let BankGO do it.

---

## 2. What to build: Supabase Edge Function "auth-redirect" (or similar name)

Create a **Supabase Edge Function** that:

1. **Receives** the Supabase auth redirect (GET) with query params that Supabase adds, including:
   - `code` — one-time auth code from Supabase
   - Optionally `target` and `next` (or equivalent) so the function knows where to send the user

2. **Allowlist:** Only redirect to the banking app if `target` (or your chosen param) equals a known value (e.g. `banking`) and the destination is the known banking app callback URL. Hardcode or use an env var for the banking app base URL, e.g.:
   - `BANKING_APP_URL = "https://excahnge-bankinkg.vercel.app"`
   - Banking callback = `BANKING_APP_URL + "/auth/callback"`

3. **Redirect:** If the request is for the banking app and you have a valid `code`:
   - Build URL: `{BANKING_APP_URL}/auth/callback?code={code}&next={next}` where `next` is a safe relative path (e.g. `/dashboard` or `/dashboard/banking`). If `next` is missing or invalid, use `/dashboard`.
   - Return an HTTP **302** (or **303**) redirect to that URL. Do not exchange the code yourself; just pass the user (and the code) to BankGO so BankGO can call `exchangeCodeForSession` and set its own session.

4. **If not banking:** If `target` is not banking (or missing), redirect to your Exchange app's post-login URL (e.g. Exchange dashboard) with the same `code` so Exchange can exchange it and set its own session, or return an error if you don't support that.

5. **Security:**
   - Do not accept arbitrary redirect URLs. Only redirect to the allowlisted banking callback URL or your own Exchange URLs.
   - Validate that `next` (when present) is a relative path starting with `/` and not `//` or a protocol (same rules as in BankGO's `lib/safe-redirect.ts`).

---

## 3. How Exchange should use this Edge Function

- When the user lands on Exchange **signup** or **login** with a valid `return_to` pointing to the banking app (e.g. `https://excahnge-bankinkg.vercel.app/auth/callback`), do **not** use that URL directly as Supabase `redirectTo` if you need a single redirect URL. Instead:
  - Use your **Edge Function URL** as the Supabase `redirectTo`, e.g.  
    `https://<project-ref>.supabase.co/functions/v1/auth-redirect?target=banking&next=/dashboard`
  - Supabase will then redirect the user to the Edge Function with the auth `code` in the query string. The Edge Function reads `code` and `target=banking`, then redirects the user to  
    `https://excahnge-bankinkg.vercel.app/auth/callback?code=...&next=/dashboard`  
  - BankGO's `/auth/callback` will exchange the code and redirect the user to `/dashboard` (or the given `next`).
- In **Supabase Dashboard** → Authentication → URL Configuration, add your **Edge Function URL** (and optionally the banking callback URL) to **Redirect URLs** so Supabase allows redirecting there with the code.

---

## 4. Edge Function sketch (Deno)

- Use **Deno** and the Supabase Edge Functions runtime.
- In the handler:
  - Parse `request.url` (or `req.url`) and read `code`, `target`, `next`.
  - If `target === "banking"` and `code` is present:
    - Sanitize `next` (only allow relative path, default `/dashboard`).
    - Redirect to `BANKING_APP_URL + "/auth/callback?code=" + encodeURIComponent(code) + "&next=" + encodeURIComponent(next)`.
  - Otherwise, redirect to your Exchange app with the code or handle as you do today.
- Deploy the function with the Supabase MCP `deploy_edge_function` tool or the Supabase CLI. Set `verify_jwt: false` for this function if the redirect is called by the browser with only query params (no JWT). If you protect it another way (e.g. allowlisted redirect from Supabase only), document it.

---

## 5. Checklist

- [ ] Read BankGO's `app/auth/callback/route.ts`, `lib/config.ts`, and `lib/safe-redirect.ts`.
- [ ] Create a Supabase Edge Function that accepts the auth redirect with `code` and `target` (and optional `next`).
- [ ] Allowlist only the banking app callback URL; sanitize `next` to relative path only.
- [ ] Redirect to `https://excahnge-bankinkg.vercel.app/auth/callback?code=...&next=...` when `target=banking`.
- [ ] Add the Edge Function URL to Supabase Redirect URLs.
- [ ] In Exchange, when the user has a valid banking `return_to`, use the Edge Function URL (with `target=banking`) as `redirectTo` for Supabase auth so the flow finishes on BankGO.

This finishes the process: user signs up or signs in on Exchange → Supabase redirects to your Edge Function with the code → Edge Function redirects to BankGO's `/auth/callback` with the code → BankGO exchanges the code and redirects the user to the dashboard.
