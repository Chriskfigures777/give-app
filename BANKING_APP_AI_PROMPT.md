# AI Prompt: Build a Fully Functional Banking App (Unit + Supabase + Auth0)

Use this prompt to instruct an AI agent to create or rebuild a banking application that correctly handles login, authentication, and token exchange. This prompt is based on analysis of the give-app-main codebase, where **authentication works but token exchange is failing**.

---

## Master Prompt (Copy & Paste)

```
You are building a banking application. Here is how it works:

- **Auth0** is the authentication app — users log in there. Auth0 issues the JWT.
- **Unit** is the banking platform — it receives and validates the JWT from Auth0. Unit's JWT Settings are configured to trust Auth0 (JWKS, Issuer).
- **Your app** is the banking app: it gets the Auth0 JWT, sends it to Unit (via the customer-token API), and Unit returns a banking session so the user can access their accounts.

Flow: Auth0 (login) → JWT issued by Auth0 → sent to Unit → Unit validates JWT via Auth0's JWKS → Unit returns customer token → banking UI loads.

Also:
- **Supabase** stores user data (synced from Auth0 after login)
- **Supabase MCP server** verifies schema and tables

---

## Order of Analysis (Do This First)

1. **Unit White-Label App docs** — Use this as the **initial structure** of the application. Read https://www.unit.co/docs/white-label-uis/white-label-app/ (or the content provided). The app structure, layout, and banking UI flow come from the White-Label App. Key points:
   - Use `unit-elements-white-label-app` with `jwt-token` or `customer-token` attribute
   - Script: `https://ui.s.unit.sh/release/latest/components-extended.js` (Sandbox) or `https://ui.unit.co/release/latest/components-extended.js` (Production)
   - Pass Auth0 JWT via `jwt-token`, or exchange for Unit customer token and pass via `customer-token`
   - **Logout:** Clear `localStorage.removeItem('unitCustomerToken')` and `localStorage.removeItem('unitVerifiedCustomerToken')` when user logs out
   - JWT must include `sub`, `exp`, `iss` (RS256). Auth0 provides this.
   - Optional: `theme`, `language`, `settings-json` attributes; `unitApplicationFormCompleted` event

2. **Read `.env.local`** — Contains Supabase, Auth0, Unit, and app URLs. Use it for all configuration.

3. **Analyze give-app-main** — Use **only** for colors, fonts, and overall design feel. Inspect `globals.css`, `tailwind.config`, `DASHBOARD_AI_PROMPT.md`, and component styles. Do NOT use give-app-main for structure or layout — that comes from the White-Label App.

Your job is to create a banking app that:
1. Uses Auth0 for login — NO custom login menu like the current app. Users sign in via Auth0's hosted UI (redirect or popup).
2. After Auth0 login, syncs user info to Supabase (creates/updates user_profiles) so the database has the user record.
3. Exchanges tokens properly and regularly for Unit (Auth0 JWT → Unit customer token).
4. Uses give-app-main only for design (colors, fonts, overall feel) — not for structure. Structure comes from the White-Label App.
5. Uses .env.local for all configuration.

---

## CRITICAL: Auth Flow (Auth0 Primary, Supabase for Storage)

**Do NOT build a custom login form.** The app uses Auth0 as the authentication provider.

1. User visits the app → if not authenticated, redirect to Auth0 login (or show "Log in with Auth0" button that triggers redirect/popup).
2. User signs in via Auth0's hosted login page (email/password, social, etc. — whatever Auth0 is configured for).
3. Auth0 redirects back to your app (e.g. `/auth/auth0-callback`) with auth code.
4. App exchanges code for tokens, then calls a sync API (e.g. `/api/auth0/sync-user`) that:
   - Verifies the Auth0 token
   - Creates or updates the user in Supabase `user_profiles` (id, auth0_user_id, email, name, etc.)
   - Links Auth0 identity to Supabase record
5. User is now "logged in" — session is Auth0-based; Supabase holds the canonical user data for the app.

---

## CRITICAL: Token Exchange (In Detail)

### How Tokens Flow

| Token | Source | Purpose | Lifetime |
|-------|--------|---------|----------|
| Auth0 Access Token (JWT) | Auth0 `getAccessTokenSilently()` | Proves user identity to your API and Unit | ~24h (configurable) |
| Unit Customer Token | Unit API `POST /customers/{id}/token` | Lets Unit white-label app load for this user | Short-lived (minutes) |

### When to Exchange Tokens

1. **On banking page load:** Get fresh Auth0 JWT → call `/api/unit/customer-token` with it → receive Unit customer token → pass to `<unit-elements-white-label-app customer-token="...">`.

2. **When Auth0 token expires:** Auth0 SDK can refresh silently. Use `getAccessTokenSilently()` with `cacheMode: "off"` when you need a guaranteed fresh token for Unit (e.g. before calling customer-token). Avoid cached tokens — if Auth0 rotated keys, cached tokens can have stale `kid` and Unit will reject them ("No key found in jwks.json").

3. **When Unit customer token expires:** Unit customer tokens are short-lived. When the white-label app starts failing (e.g. 401), re-fetch:
   - Call `getAccessTokenSilently({ audience, cacheMode: "off" })` to get fresh Auth0 JWT
   - Call `/api/unit/customer-token` with that JWT
   - Update the `customer-token` attribute on the Unit element

4. **Regular refresh strategy:**
   - On mount: fetch Auth0 JWT → exchange for Unit customer token
   - Set up a timer (e.g. every 5–10 minutes) or listen for Unit errors to refresh the Unit customer token before it expires
   - Use `getAccessTokenSilently` with `cacheMode: "off"` when exchanging for Unit to avoid stale tokens

### Token Exchange Flow (Step by Step)

1. Client: `getAccessTokenSilently({ authorizationParams: { audience: NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE }, cacheMode: "off" })` → Auth0 JWT
2. Client: `fetch("/api/unit/customer-token", { headers: { Authorization: "Bearer " + auth0Jwt } })`
3. Server: Verify Auth0 JWT via JWKS, extract `sub` (Auth0 user id)
4. Server: Look up `user_profiles` WHERE `auth0_user_id = sub` → get `unit_customer_id`
5. Server: `POST ${UNIT_API_URL}/customers/${unitCustomerId}/token` with `{ jwtToken: auth0Jwt }`
6. Unit returns `{ data: { attributes: { token: "..." } } }` → customer token
7. Client: Pass customer token to Unit element: `el.setAttribute("customer-token", token)`

---

## Unit JWT Settings (In Detail)

Unit uses **Custom Authentication** with Auth0. In **Unit Dashboard → Settings → Org Settings → JWT Settings**, configure:

### Provider
- **Auth0** — select from the list of supported providers.

### JWKS Path (Required)
- **Value:** `https://dev-xu3cgr3v5sc87jnp.us.auth0.com/.well-known/jwks.json`
- **Purpose:** Unit fetches Auth0's public keys from this URL to verify your JWTs. The `kid` (key ID) in the JWT header must match a key in this JWKS.
- **Note:** If Auth0 rotates keys, new JWTs use a new `kid`. Use `cacheMode: "off"` when getting tokens so you don't send stale JWTs with old `kid` that Unit can't find.

### Issuer (Optional but Recommended)
- **Value:** `https://dev-xu3cgr3v5sc87jnp.us.auth0.com/`
- **Purpose:** Unit validates that the JWT's `iss` claim matches this. Must match exactly (including trailing slash). Prevents token confusion.
- **Critical:** The trailing slash is required. `https://dev-xu3cgr3v5sc87jnp.us.auth0.com` (no slash) will fail.

### Custom Domain (Optional)
- **Value:** `https://your-custom-domain.com` (replace with your actual custom Auth0 domain if you use one)
- **Purpose:** If Auth0 is configured with a custom domain, use that here. Otherwise leave blank or use the default Auth0 domain.

### JWT Audience (if applicable)
- Your Auth0 API identifier (e.g. `https://unit-banking`) must match `NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE`.
- Create an API in Auth0 Dashboard → APIs with that identifier so `getAccessTokenSilently({ audience })` returns a JWT that Unit can validate.

### Summary of Current Unit Config

| Field | Value |
|-------|-------|
| Provider | Auth0 |
| JWKS Path | `https://dev-xu3cgr3v5sc87jnp.us.auth0.com/.well-known/jwks.json` |
| Issuer | `https://dev-xu3cgr3v5sc87jnp.us.auth0.com/` |
| Custom Domain | `https://your-custom-domain.com` (optional; use only if you have a custom Auth0 domain) |

---

## BUG TO FIX: Response Status Lost in Fetch Chain

In the customer-token fetch, do NOT do:
```javascript
fetch("/api/unit/customer-token", {...})
  .then((res) => res.json())
  .then((data) => {
    if (data.token) { ... }
    else if (res.status === 404 || res.status === 400) { ... }  // BUG: res is not in scope!
  });
```

Fix:
```javascript
fetch("/api/unit/customer-token", {...})
  .then(async (res) => {
    const data = await res.json();
    if (data.token) return { success: true, token: data.token };
    if (res.status === 404 || res.status === 400) return { fallback: true };
    return { error: true };
  })
  .then((result) => { /* handle result */ });
```

---

## Environment Variables (.env.local)

**Read and use .env.local.** It contains everything needed. Key variables:

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Auth0 (banking):** `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE`, `NEXT_PUBLIC_AUTH0_DOMAIN`, `NEXT_PUBLIC_AUTH0_CLIENT_ID`, `NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE`
- **Unit:** `UNIT_API_TOKEN`, `UNIT_API_URL`, `UNIT_ORG_ID`, `UNIT_WEBHOOK_SECRET`
- **App:** `DOMAIN`, `NEXT_PUBLIC_APP_URL`

**Note:** If .env.local starts with an error message block (lines 1–19), skip that and use the actual env vars below it. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

---

## Supabase MCP Server — Use It

Use the **user-supabase** MCP server to:
1. **list_tables** — list all tables in `public` schema
2. **execute_sql** — run queries to inspect schema
3. **list_migrations** — see applied migrations

**Required tables for banking:**
- `user_profiles` — must have `unit_customer_id`, `auth0_user_id`, and user fields (email, name, etc.)

**Unit webhook** saves `unit_customer_id` to `user_profiles` when `customer.created` is received. Match by `auth0_user_id` (Auth0 `sub` claim). Ensure `user_profiles` exists and has these columns.

---

## Design System (Colors, Fonts, Overall Feel)

**Use give-app-main only for design** — colors, fonts, and overall design feel. Do NOT use it for structure or layout; that comes from the White-Label App.

Inspect give-app-main for:
- `src/app/globals.css` — CSS variables, theme tokens
- `tailwind.config.*` — colors, typography, spacing
- `DASHBOARD_AI_PROMPT.md` — color palette and design specs
- `src/components/` — how components use colors and fonts (e.g. `rounded-xl`, `border-dashboard-border`)

Apply these to the White-Label App wrapper (e.g. via `settings-json` or `theme`). Reference values:

- **Primary colors:** Emerald/teal (`#059669`, `emerald-500`, `emerald-600`, `teal-600`)
- **Unit component settings:** `colors: { primary: "#059669" }`
- **Buttons:** `from-emerald-500 via-emerald-600 to-teal-600` gradient
- **Dark mode default:** `--dashboard-bg`, `--dashboard-card`, `--dashboard-text`, `--dashboard-text-muted`
- **Active nav:** `bg-emerald-500/20 text-emerald-400`

---

## API Routes to Implement

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth0/sync-user` | POST | After Auth0 login: verify token, create/update user in Supabase `user_profiles` (auth0_user_id, email, name) |
| `/api/auth/signout` | POST | Clear Auth0 session + Unit tokens from localStorage |
| `/api/unit/customer-token` | GET | Exchange Auth0 JWT for Unit customer token |
| `/api/unit/customer-status` | GET | Check if user has `unit_customer_id` (uses Auth0 JWT to identify user) |
| `/api/unit/create-application-form` | POST | Create Unit application form for new users |
| `/api/webhooks/unit` | POST | Receive `customer.created` → save `unit_customer_id` to `user_profiles` (match by auth0_user_id) |
| `/auth/auth0-callback` | GET | Auth0 redirect callback → exchange code for tokens → sync user to Supabase → redirect to app |

---

## Auth Flow Summary

1. **Login:** User clicks "Log in" or visits protected route → redirect to Auth0 (`loginWithRedirect`) or open Auth0 popup. NO custom login form.
2. **Auth0 callback:** Auth0 redirects to `/auth/auth0-callback` → app exchanges code for tokens → calls `/api/auth0/sync-user` to create/update user in Supabase → redirect to dashboard/banking.
3. **Banking:** User is already Auth0-authenticated → `getAccessTokenSilently({ audience, cacheMode: "off" })` → `/api/unit/customer-token` with Auth0 JWT → Unit customer token → pass to white-label app.
4. **Token refresh:** Periodically (or on Unit 401) re-fetch Auth0 JWT (cacheMode: "off") and exchange for new Unit customer token.

---

## Checklist

- [ ] Use Supabase MCP `list_tables` to verify `user_profiles` has `unit_customer_id` and `auth0_user_id`
- [ ] Read `.env.local` and ensure all required vars are present
- [ ] NO custom login form — use Auth0 hosted UI (redirect or popup)
- [ ] Implement `/api/auth0/sync-user` to create/update Supabase user after Auth0 login
- [ ] Fix the token exchange fetch chain (res.status in scope)
- [ ] Use `cacheMode: "off"` when getting Auth0 JWT for Unit to avoid stale kid/JWKS errors
- [ ] Implement periodic Unit customer token refresh (timer or on 401)
- [ ] Unit JWT Settings: JWKS Path = `https://dev-xu3cgr3v5sc87jnp.us.auth0.com/.well-known/jwks.json`, Issuer = `https://dev-xu3cgr3v5sc87jnp.us.auth0.com/` (trailing slash)
- [ ] Auth0: Create API in Auth0 Dashboard with identifier = `NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE`

---

## Reference Files

| Purpose | File / URL |
|--------|------------|
| **Unit White-Label App (read first)** | https://www.unit.co/docs/white-label-uis/white-label-app/ |
| Config | `.env.local` |
| CSS / design system | `src/app/globals.css`, `tailwind.config.*`, `DASHBOARD_AI_PROMPT.md` |
| Unit setup | `docs/UNIT_BANKING_SETUP.md` |
| Auth0 setup | `docs/AUTH0_SDK_SETUP.md`, `docs/AUTH0_APPLICATION_SETUP.md` |
| Supabase client | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` |
| Auth helpers | `src/lib/auth.ts` |
| Unit token hooks | `src/hooks/use-unit-token.ts`, `src/hooks/use-unit-token-auth0.ts` |
| Unit wrapper | `src/components/unit/unit-elements-wrapper.tsx` |
| Customer token API | `src/app/api/unit/customer-token/route.ts` |
```

---

## Shorter Variant (Quick Copy)

```
Build a banking app with Auth0 as PRIMARY login (no custom login form). **Structure:** Use Unit White-Label App as initial structure. **Design:** Use give-app-main only for colors, fonts, overall feel (not structure). Order: 1) Unit White-Label App docs; 2) .env.local; 3) give-app-main for design. Use unit-elements-white-label-app. Clear unitCustomerToken/unitVerifiedCustomerToken on logout. Exchange Auth0 JWT for Unit customer token; cacheMode: "off". Unit JWT: Auth0, JWKS/Issuer as specified.
```

---

*Use this prompt with any AI coding assistant to build a banking app with correct login, authentication, and token exchange.*
