# Unit Banking Setup (Custom Build)

This guide covers the configuration needed for Unit banking to work end-to-end: application form → approval → database save → banking dashboard.

## Prerequisites

- Unit Sandbox account: [app.s.unit.sh](https://app.s.unit.sh)
- Supabase project with `unit_customer_id` column on `user_profiles`

## 1. Unit Dashboard — JWT Settings (Required)

Unit uses your app's JWT to identify users and verify they are logged in. Unit does **not** ask users for separate banking credentials. Before sensitive banking activities, Unit will OTP the user.

**Sandbox OTP code:** Use `000001` to complete any OTP challenge in sandbox.

Configure in **Unit Dashboard → Settings → Org Settings → JWT Settings**:

1. **Provider**: Choose **Custom with JWKS** (or Auth0 if listed)
2. **JWKS Path**: Your identity provider's JWKS URL
3. **JWT Issuer**: Your identity provider's issuer URL
4. **JWT Audience** (if applicable): Match your API identifier

### Supabase

- JWKS Path: `https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json`
- JWT Issuer: `https://<your-project-ref>.supabase.co/auth/v1`
- JWT Audience: `authenticated`

### Auth0

- JWKS Path: `https://<domain>.auth0.com/.well-known/jwks.json`
  - Example: `https://dev-xu3cgr3v5sc87jnp.us.auth0.com/.well-known/jwks.json`
- JWT Issuer: `https://<domain>.auth0.com/`
  - Example: `https://dev-xu3cgr3v5sc87jnp.us.auth0.com/`
- JWT Audience (optional): Your Auth0 API identifier, e.g. `https://unit-banking` (must match `NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE`)

Replace `<domain>` with your Auth0 tenant from `NEXT_PUBLIC_AUTH0_DOMAIN`.

Without this, Unit cannot recognize your users' JWTs and will reject them or show errors.

## 2. Unit Dashboard — Webhook (Required for DB Save)

When a user's application is approved, Unit sends `customer.created`. We must receive it to save `unit_customer_id` to the database.

1. Go to **Developer → Webhooks → Create**
2. **URL**: `https://give-app78.vercel.app/api/webhooks/unit` (or your production URL)
3. **Token**: Use the same value as `UNIT_WEBHOOK_SECRET` in your env
4. **Content Type**: Json or JsonAPI
5. **Delivery Mode**: At least once (recommended)
6. **Subscription Type**: NotAuthorizationRequest (or All)
7. Subscribe to `customer.created` (and optionally `application.created`, `application.denied`, etc.)

## 3. Environment Variables

Set in Vercel (and `.env.local` for local dev):

| Variable | Description |
|----------|-------------|
| `UNIT_API_TOKEN` | Org API token from Unit Dashboard → Settings → API Tokens |
| `UNIT_API_URL` | `https://api.s.unit.sh` (sandbox) or `https://api.unit.co` (production) |
| `UNIT_ORG_ID` | Optional. Positive integer. Only needed for direct customer creation. |
| `UNIT_WEBHOOK_SECRET` | Secret for webhook signature verification and callbacks |

## 4. Callback Endpoints (Optional but Recommended)

Configure in Unit Dashboard → Settings → Callback Endpoints:

| Endpoint | URL |
|----------|-----|
| Application Prefill | `https://give-app78.vercel.app/api/unit/application-prefill` |
| User Management | `https://give-app78.vercel.app/api/unit/user-management` |
| Banking Page URL | `https://give-app78.vercel.app/banking` |
| Reactivation Billpay | `https://give-app78.vercel.app/banking/billpay` |

## 5. Supabase JWT Hook (Supabase auth only)

When using Supabase for banking auth, the `unit_jwt_hook` adds `unitRole: "individual"` to every JWT. Enable it:

1. Run migration: `supabase db push` (includes `20260302000000_unit_banking_jwt_hook.sql`)
2. Supabase Dashboard → Authentication → Hooks → Custom Access Token
3. Select function: `public.unit_jwt_hook`

(Skip this when using Auth0 for banking.)

## Flow Summary

1. User goes to **Banking** → sees "Open an Account" CTA or "Sign in with Auth0"
2. User authenticates (Supabase or Auth0) → Unit component loads with their JWT
3. User fills application → Unit processes it
4. Unit approves → sends `customer.created` webhook to `/api/webhooks/unit`
5. We save `unit_customer_id` to `user_profiles`
6. User refreshes or returns → `customer-token` API finds `unit_customer_id` → returns token → banking dashboard loads

## Localhost Development

Banking works on `http://localhost:3000` with the same setup:

1. **Log in on localhost** — Visit `http://localhost:3000/login` and sign in. If you go to `/dashboard/banking` while logged out, you'll be redirected to login and returned to banking after signing in.

2. **`.env.local`** — Add Unit vars (same as production):
   ```
   UNIT_API_TOKEN=your_sandbox_token
   UNIT_API_URL=https://api.s.unit.sh
   UNIT_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Supabase** — Add `http://localhost:3000` to Redirect URLs:
   - Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

4. **Unit Dashboard** — JWKS URL is the same (Supabase/Auth0 URL, not app URL). No localhost-specific config.

5. **Webhook** — For localhost, use [ngrok](https://ngrok.com) or [webhook.site](https://webhook.site) to receive `customer.created`, or test on Vercel.

6. **Clear Unit cache** when switching users or debugging:
   - DevTools → Application → Local Storage → remove `unitCustomerToken`, `unitVerifiedCustomerToken`

**Note:** 404 on `/api/unit/customer-token` when logged in = "no banking account yet" (expected). The page shows "Open an Account". Unit 401s = JWKS not configured in Unit Dashboard.

## Troubleshooting

- **404 on customer-token**: Expected for new users (no `unit_customer_id`). Page shows "Open an Account" CTA.
- **Unit 401 (theme/user/app)**: Unit cannot validate your JWT → configure JWKS URL in Unit Dashboard → Settings → Org Settings → JWT Settings
- **"No key found in jwks.json with kid ..." (Unit 400)**: (1) Unit Issuer must be exactly `https://<domain>.auth0.com/` (with `https://` and trailing slash) — e.g. `https://dev-xu3cgr3v5sc87jnp.us.auth0.com/`. (2) Create an Auth0 API (Dashboard → APIs) with identifier matching `NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE` (e.g. `https://unit-banking`) so `getAccessTokenSilently` returns a JWT. (3) When this error occurs, the app now falls back to the application form so you can complete sign-up.
- **"Demo" or generic view**: Same as above — JWKS not configured
- **Application submits but no DB save**: Webhook not configured or `UNIT_WEBHOOK_SECRET` mismatch
