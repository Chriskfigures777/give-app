# Unit Banking Setup

This guide covers the configuration needed for Unit Ready-to-Launch banking to work end-to-end: application form → approval → database save → banking dashboard.

## Prerequisites

- Unit Sandbox account: [app.s.unit.sh](https://app.s.unit.sh)
- Supabase project with `unit_customer_id` column on `user_profiles`

## 1. Unit Dashboard — Authentication (Required)

Unit must validate your Supabase JWT. Configure in **Developer → Settings → Authentication**:

1. **Provider**: Choose "Custom" or "JWKS"
2. **JWKS URL**: `https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json`
   - Find your project ref in Supabase Dashboard → Settings → API
3. **Issuer** (if required): `https://<your-project-ref>.supabase.co/auth/v1`

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
| `UNIT_API_TOKEN` | API token from Unit Dashboard → Settings → API Tokens |
| `UNIT_API_URL` | `https://api.s.unit.sh` (sandbox) or `https://api.unit.co` (production) |
| `UNIT_WEBHOOK_SECRET` | Secret for webhook signature verification and callbacks |

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

## Troubleshooting

- **"Demo" or generic view**: Unit cannot validate your JWT → check JWKS URL and Issuer in Unit Dashboard
- **Application submits but no DB save**: Webhook not configured or `UNIT_WEBHOOK_SECRET` mismatch
- **401 on customer-token**: User has no `unit_customer_id` yet (application pending or webhook not received)
