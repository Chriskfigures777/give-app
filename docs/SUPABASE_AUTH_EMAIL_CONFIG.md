# Supabase Auth Email & URL Configuration

This guide explains how to configure Supabase so that auth emails (signup confirmation, password reset) redirect to your production URL instead of localhost.

## 1. Set Environment Variables

In production (e.g. Vercel), set:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
DOMAIN=https://your-domain.com
```

- **NEXT_PUBLIC_APP_URL** – Used by the client for email redirect URLs (signup, password reset). Must be your production URL.
- **DOMAIN** – Fallback used by the server when constructing redirect URLs.

For local development, these default to `http://localhost:3000`. To test production-like email links locally, you can set `NEXT_PUBLIC_APP_URL` to a tunnel URL (e.g. ngrok).

## 2. Configure Supabase Dashboard

### Site URL

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **URL Configuration**
3. Set **Site URL** to your production URL, e.g. `https://your-domain.com`

### Redirect URLs

Add these to **Redirect URLs** (one per line):

```
https://your-domain.com/**
https://your-domain.com/auth/callback
https://your-domain.com/login
https://your-domain.com/update-password
```

For local development, also add:

```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

The `/**` pattern allows any path under your domain. The auth callback route (`/auth/callback`) handles email confirmation and password reset links.

## 3. Email Templates

To customize auth emails (confirmation, password reset, etc.), go to **Authentication** → **Email Templates**.

**Ready-to-use templates:** See [SUPABASE_EMAIL_TEMPLATES.md](./SUPABASE_EMAIL_TEMPLATES.md) for branded HTML templates you can copy into Supabase. They include:

- **Confirm signup** – Welcome email with confirmation button
- **Reset password** – Password reset with clear call-to-action
- **Magic link** – Passwordless sign-in (optional)

Template variables Supabase provides:

- `{{ .ConfirmationURL }}` – The verification link (required for the button)
- `{{ .Email }}` – User's email (for personalization)
- `{{ .SiteURL }}` – Your configured Site URL

## 4. Auth Flow Summary

| Flow | Redirect URL | Handler |
|------|--------------|---------|
| Signup confirmation | `/auth/callback?org=...` | Exchanges code, redirects to give page or dashboard |
| Password reset | `/auth/callback?next=/update-password` | Exchanges code, redirects to update-password page |
| Magic link | `/auth/callback` | Exchanges code, redirects to dashboard |
