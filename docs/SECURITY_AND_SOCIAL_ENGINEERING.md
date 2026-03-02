# GIVE App Security & Social Engineering Mitigation Guide

This document outlines security measures implemented in the GIVE app and provides guidance for keeping the application secure against social engineering and other threats.

---

## 1. Authentication & Session Security

### Cookies
- **Supabase SSR** handles session cookies via `@supabase/ssr`. Cookies are set with:
  - `httpOnly` — prevents JavaScript access (mitigates XSS cookie theft)
  - `secure` — sent only over HTTPS in production
  - `sameSite` — protects against CSRF
- Ensure production runs over **HTTPS** so secure cookies work correctly.

### Session Validation
- Use `supabase.auth.getUser()` (not `getSession()`) for server-side auth checks. `getSession()` reads from storage and may be stale; `getUser()` validates with the auth server.
- All protected API routes use `requireAuth()`, `requireOrgAdmin()`, or `requirePlatformAdmin()` from `@/lib/auth`.

---

## 2. API Endpoint Security

### Protected Endpoints
| Endpoint Type | Protection |
|---------------|------------|
| Dashboard APIs | `requireAuth()` or `requireOrgAdmin()` |
| Admin APIs | `requirePlatformAdmin()` |
| Webhooks | Signature verification (Stripe, Resend) |
| Sync/Dev tools | `CONNECT_SYNC_SECRET` header required |

### Public Endpoints (Intentional)
- `/api/search` — search organizations/events (public explore data)
- `/api/public/forms/submit` — website forms (CORS allowed)
- `/api/public/cms/[orgSlug]` — public CMS content
- `/api/donations/by-payment-intent` — receipt lookup (requires `pi_xxx` ID)
- `/api/survey/responses` — church market survey (rate-limited recommended)

### Input Sanitization
- Search API: `sanitizeSearchInput()` limits length (200 chars) and strips control characters
- Supabase uses parameterized queries — no raw SQL injection

---

## 3. Sensitive Data & Logging

### Production Logging
- **Never log** sensitive data in production: org IDs, user IDs, tokens, payment intents, emails
- `console.log` / `console.error` with sensitive payloads are gated to `NODE_ENV === "development"`
- Use `@/lib/secure-log` for safe logging patterns

### Environment Variables
- `NEXT_PUBLIC_*` vars are exposed to the browser — only use for non-secret values (URLs, publishable keys)
- Never expose: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, webhook secrets, API keys

---

## 4. Social Engineering Mitigation

### For Staff & Admins
1. **Never share credentials** — no admin passwords, API keys, or webhook secrets via email, Slack, or phone
2. **Verify identity** — use established channels (e.g., known Slack/email) before acting on support requests
3. **No “urgent” bypasses** — if someone pressures you to skip verification, treat it as suspicious
4. **MFA for admin accounts** — enable 2FA on Supabase, Stripe, Vercel, and any platform admin

### For Organizations (Users)
1. **Phishing awareness** — GIVE will never ask for passwords via email or chat
2. **Support impersonation** — attackers may impersonate “support” to request access; verify via official channels only
3. **Link safety** — always check URLs before logging in; use bookmarks or type the domain directly

### Technical Safeguards
- **Rate limiting** — consider adding rate limits for signup, login, password reset, and public forms
- **Webhook verification** — Stripe and Resend webhooks require valid signatures; never skip in production
- **CONNECT_SYNC_SECRET** — required for `/api/connect/sync-verification`; endpoint returns 503 if not set

---

## 5. Security Headers

Configured in `next.config.ts`:
- `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage
- `Permissions-Policy` — restricts camera, microphone, geolocation

---

## 6. SQL & JSON Injection

- **Supabase**: All queries use the client library (parameterized). No raw SQL with user input.
- **JSON**: User input is validated and typed before storage. `JSON.parse` on user-supplied strings is avoided where possible; when used, errors are caught and rejected.

---

## 7. Search Bar & Code Access

- **Dashboard search** — navigates to pages, orgs, or events; does not expose server code or paths
- **API search** — returns only public data; RLS and Supabase policies apply
- **No path traversal** — dynamic routes (`[slug]`, `[id]`) are validated; no `../` or filesystem access

---

## 8. Checklist for Deployment

- [ ] `HTTPS` only in production
- [ ] `STRIPE_WEBHOOK_SECRET` set (and verify webhook signature)
- [ ] `CONNECT_SYNC_SECRET` set if using sync-verification
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never exposed to client
- [ ] `.env.local` and `.env` in `.gitignore` (never committed)
- [ ] RLS enabled on all Supabase tables

---

## 9. Incident Response

If you suspect a compromise:
1. Rotate all secrets (Stripe, Supabase, Resend, etc.)
2. Review recent admin activity
3. Check for new or modified API keys
4. Notify affected users if data was exposed

---

*Last updated: February 2025*
