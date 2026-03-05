# AI Prompt: Exchange App — Handling Banking App Redirects

Use this prompt in the **Exchange** codebase (the main product, not the banking app) so that when users sign up or sign in after coming from Exchange Banking, they are sent back to the banking app with a valid auth flow.

---

## Context

- **Banking app URL:** `https://excahnge-bankinkg.vercel.app`
- **Exchange** and **Exchange Banking** share the same Supabase project (same users, same auth).
- They are different origins, so **cookies are not shared**. Do not rely on cookie sharing. Use a **redirect-with-code** flow so the banking app can establish its own session.

---

## What to implement in Exchange

### 1. Detect when the user came from the banking app

- On **signup** and **login** pages, read the query parameter **`return_to`**.
- Example: user opens  
  `https://<exchange-app>/signup?return_to=https://excahnge-bankinkg.vercel.app/auth/callback`  
  or the same on `/login`.
- If `return_to` is present and valid (see allowlist below), treat this as "user wants to return to banking after auth."

### 2. Allowlist for `return_to` (security)

- Only accept `return_to` if it is exactly one of:
  - `https://excahnge-bankinkg.vercel.app/auth/callback`
  - Or a base URL you configure for the banking app (e.g. from env), then allow only `{BANKING_APP_URL}/auth/callback`.
- Reject any other host or path (no open redirects). If invalid, ignore `return_to` and use your normal post-login/signup redirect.

### 3. After signup or sign-in: send user to banking with the auth code

- **Preferred (simplest):** When the user has a valid `return_to` (banking callback URL), pass that URL as **`redirectTo`** (or your Supabase client's equivalent option) when calling **Supabase auth** (e.g. `signUp`, `signInWithOtp`, OAuth). Then Supabase will redirect the user directly to the banking app with `?code=...` in the URL. The banking app's `/auth/callback` will exchange the code for a session. No cookie sharing is needed.
- **Supabase Dashboard:** In Authentication → URL Configuration, add the banking callback to **Redirect URLs**, e.g. `https://excahnge-bankinkg.vercel.app/auth/callback`.
- **Optional `next`:** The banking app supports a `next` query param (e.g. `/dashboard`). You can append it when building the redirect URL, e.g. pass `return_to + '?next=/dashboard'` as the redirect target if your Supabase client allows it, or ensure the banking app's callback accepts `next` (it already does).
- **If you handle the callback on Exchange:** When your auth callback receives the Supabase `code`, if you had stored a valid `return_to`, redirect the user to `{return_to}?code={code}&next=/dashboard` so the **banking** app receives the code and exchanges it (do not exchange the code yourself in that case, or the code will be consumed and banking won't get a session). Prefer instead having Supabase redirect straight to the banking URL via `redirectTo` so the code is only used once on the banking app.

### 4. Do not rely on cookies across domains

- Exchange and Banking are on different domains. Browsers do not send Exchange cookies to the banking app.
- The **safe** approach is: after auth on Exchange, redirect to the banking app's callback URL **with the Supabase `code`** so the banking app can call `exchangeCodeForSession(code)` and set its own session/cookies on the banking domain.

### 5. Optional: "Sign in with Exchange" from banking

- If the banking app sends users to Exchange **login** with the same `return_to` (e.g. "Sign in with Exchange" link to  
  `https://<exchange-app>/login?return_to=https://excahnge-bankinkg.vercel.app/auth/callback`),  
  apply the same logic: after successful login, redirect to the allowlisted banking callback with the auth `code` and optional `next`.

---

## Summary checklist for Exchange

- [ ] Read `return_to` on signup and login entry points.
- [ ] Allowlist only the banking app callback URL (e.g. `https://excahnge-bankinkg.vercel.app/auth/callback`).
- [ ] After successful signup/login, if `return_to` is valid, redirect to `{return_to}?code={...}&next=/dashboard` (or your chosen default path).
- [ ] Do not depend on shared cookies; use redirect-with-code so the banking app can establish its own session.
- [ ] Ensure Supabase Redirect URLs in the dashboard include the banking app callback URL so the code flow is allowed.

Once this is implemented, users who sign up or sign in on Exchange after being sent from the banking app will land back on the banking app with a valid session.

**Optional — Supabase Edge Function:** If you want a single redirect URL in Supabase that then forwards to the banking app with the auth code, use the prompt in **`docs/EXCHANGE-EDGE-FUNCTION-PROMPT.md`** in this repo. That prompt describes how to view the BankGO codebase and create a Supabase Edge Function so the flow is: Exchange → Supabase auth → Edge Function → BankGO `/auth/callback` with code.

**Note:** If signup is password-based (no magic link/OAuth), you may redirect the user to the banking app's login page with a query like `?from=exchange` or a success message so they can log in there with the same credentials; the banking app does not share cookies with Exchange, so they must complete login on the banking domain.
