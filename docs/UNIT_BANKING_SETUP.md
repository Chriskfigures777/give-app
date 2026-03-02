# Unit Banking Setup

This guide covers the configuration needed for Unit banking to work end-to-end: application form → approval → database save → banking dashboard.

## Unit Ready-to-Launch vs Custom Build

| Mode | Dashboard | JWT Settings | Flow |
|------|-----------|--------------|------|
| **Ready-to-Launch** | Simplified; no Org Settings | Identity Provider only (Developer → Authentication) | Set `NEXT_PUBLIC_UNIT_READY_TO_LAUNCH=true` — app uses `jwt-token` only |
| **Custom Build** | Full; Org Settings → JWT Settings | Org-level JWT Settings + Identity Provider | App uses `customer-token` API when available; falls back to `jwt-token` if jwtSettings error |

**Ready-to-Launch** does not expose Org Settings or JWT Settings. The customer-token API requires those, so it will fail. Set `NEXT_PUBLIC_UNIT_READY_TO_LAUNCH=true` so the app skips the customer-token API and always uses `jwt-token` (validated by Identity Provider).

## Prerequisites

- Unit Sandbox account: [app.s.unit.sh](https://app.s.unit.sh)
- Supabase project with `unit_customer_id` column on `user_profiles`

## 1. Unit Dashboard — Authentication (Required)

Unit uses your app's JWT to identify users and verify they are logged in. Unit does **not** ask users for separate banking credentials. Before sensitive banking activities, Unit will OTP the user.

**Sandbox OTP code:** Use `000001` to complete any OTP challenge in sandbox.

Configure your identity provider in **Developer → Settings → Authentication**:

1. **Provider**: Choose **Custom with JWKS**
2. **JWKS Path**: `https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json`
   - Find your project ref in Supabase Dashboard → Settings → API
3. **JWT Issuer**: `https://<your-project-ref>.supabase.co/auth/v1`
4. **JWT Audience**: `authenticated` (Supabase uses this for authenticated user tokens)

Without this, Unit cannot recognize your users' JWTs and will reject them or show errors.

**Example (Supabase):**
- JWKS Path: `https://atpkddkjvvtfosuuoprm.supabase.co/auth/v1/.well-known/jwks.json`
- JWT Issuer: `https://atpkddkjvvtfosuuoprm.supabase.co/auth/v1`
- JWT Audience: `authenticated`

Unit also supports Okta, Auth0, AWS Cognito, and Stytch—configure their JWKS paths and issuers the same way. Any provider with a JWKS endpoint works with Custom with JWKS.

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
| `UNIT_API_TOKEN` | Org API token from Unit Dashboard → Settings → API Tokens (Custom Build) |
| `UNIT_API_URL` | `https://api.s.unit.sh` (sandbox) or `https://api.unit.co` (production) |
| `UNIT_ORG_ID` | Optional. Positive integer (e.g. `1` or `12345`). Only needed for direct customer creation; create-customer uses application flow. |
| `UNIT_WEBHOOK_SECRET` | Secret for webhook signature verification and callbacks |
| `NEXT_PUBLIC_UNIT_READY_TO_LAUNCH` | Set to `true` if using Unit Ready-to-Launch (simplified dashboard, no Org JWT Settings). Uses jwt-token only. |

## 4. Callback Endpoints (Optional but Recommended)

Configure in Unit Dashboard → Settings → Callback Endpoints:

| Endpoint | URL |
|----------|-----|
| Application Prefill | `https://give-app78.vercel.app/api/unit/application-prefill` |
| User Management | `https://give-app78.vercel.app/api/unit/user-management` |
| Banking Page URL | `https://give-app78.vercel.app/banking` |
| Reactivation Billpay | `https://give-app78.vercel.app/banking/billpay` |

## 5. Supabase JWT Hook

The `unit_jwt_hook` adds `unitRole: "individual"` to every JWT. Enable it:

1. Run migration: `supabase db push` (includes `20260302000000_unit_banking_jwt_hook.sql`)
2. Supabase Dashboard → Authentication → Hooks → Custom Access Token
3. Select function: `public.unit_jwt_hook`

## Flow Summary

1. User goes to **Banking** → sees "Open an Account" CTA
2. Clicks CTA → Unit component loads with their **Supabase JWT**
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

4. **Unit Dashboard** — JWKS URL is the same (Supabase URL, not app URL). No localhost-specific config.

5. **Webhook** — For localhost, use [ngrok](https://ngrok.com) or [webhook.site](https://webhook.site) to receive `customer.created`, or test on Vercel.

6. **Clear Unit cache** when switching users or debugging:
   - DevTools → Application → Local Storage → remove `unitCustomerToken`, `unitVerifiedCustomerToken`

**Note:** 404 on `/api/unit/customer-token` when logged in = "no banking account yet" (expected). The page shows "Open an Account". Unit 401s = JWKS not configured in Unit Dashboard.

## Troubleshooting

- **404 on customer-token**: Expected for new users (no `unit_customer_id`). Page shows "Open an Account" CTA.
- **Unit 401 (theme/user/app)**: Unit cannot validate your JWT → configure JWKS URL in Unit Dashboard
- **"Demo" or generic view**: Same as above — JWKS not configured
- **Application submits but no DB save**: Webhook not configured or `UNIT_WEBHOOK_SECRET` mismatch

### Ready-to-Launch shows "No customers found" but API has data

If you see customers/accounts when using the **Custom Build** dashboard (or via API) but **Ready-to-Launch** shows "No customers found", this is usually because:

1. **Different org context** — Ready-to-Launch and Custom Build may use different organizations in the Unit dashboard. Your `UNIT_API_TOKEN` is tied to one org (e.g. org 9220). When you switch to "Ready To Launch" in the Unit Sandbox UI, you may be viewing a *different* org that Unit created for Ready-to-Launch—one that starts empty. Check for an **org switcher** in the Unit dashboard and ensure you're viewing the same org as your API token (e.g. "Figures Solutions LLC" / org 9220).

2. **Application-flow only** — Ready-to-Launch may only list customers created through the **embedded application flow** (user goes to your app → Banking → Open Account → fills the Unit form). Customers created via API might not appear in the Ready-to-Launch Customers/Accounts tabs. To populate Ready-to-Launch: have a user sign in to your app, go to Banking, click "Open an Account", and complete the application. That customer should then appear in the Ready-to-Launch dashboard.

3. **Verify via API** — You can confirm your data exists: `GET https://api.s.unit.sh/customers` and `GET https://api.s.unit.sh/accounts` with your `UNIT_API_TOKEN`. If those return data, it's in your org; the Ready-to-Launch UI may simply be showing a different org or filtered view.
