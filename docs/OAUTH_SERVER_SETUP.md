# Supabase OAuth Server Setup

This guide covers enabling Supabase as an OAuth 2.1 identity provider so third-party apps can use "Sign in with [Your App]".

## 1. Enable OAuth Server in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **OAuth Server**
2. Enable the OAuth server
3. Configure:
   - **Authorization Path**: `/oauth/consent`
   - **Site URL**: `https://theexchangeapp.church` (no trailing slash)
   - **Allow Dynamic OAuth Apps**: Optional, for programmatic client registration

**Important:** Use Site URL without a trailing slash. Otherwise the preview URL will show `https://theexchangeapp.church//oauth/consent` (double slash).

## 2. Implemented Routes

| Path | Purpose |
|------|---------|
| `/oauth/consent` | Consent screen where users approve or deny third-party app access |
| `/api/oauth/decision` | Handles approve/deny form submission, redirects back to OAuth client |

## 3. Flow

1. Third-party app redirects user to Supabase Auth's `/oauth/authorize` with PKCE params
2. Supabase validates and redirects to `https://theexchangeapp.church/oauth/consent?authorization_id=...`
3. If not logged in, user is redirected to `/login?redirect=...` and returned after sign-in
4. User sees consent screen with app name, redirect URI, and requested scopes
5. User clicks Approve or Deny → form POSTs to `/api/oauth/decision`
6. Supabase issues authorization code (approve) or error (deny) and redirects back to the client app

## 4. Register OAuth Clients

In **Authentication** → **OAuth Server** → **OAuth Apps**, register each third-party client:

- **Client type**: Confidential (server-side) or Public (SPA/mobile)
- **Redirect URIs**: Exact URLs where users return after consent (e.g. `https://client-app.com/callback`)
- **Client Secret**: Shown once for confidential clients; store securely

## 5. Custom Access Token Hooks

OAuth tokens go through your [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/access-token-hook) (`unit_jwt_hook`). You can add `client_id`-based logic to customize claims for different OAuth clients.

## 6. Local Development

- Add `http://localhost:3000` to **Authentication** → **URL Configuration** → **Redirect URLs**
- Use Site URL `http://localhost:3000` for local testing
- Register a separate OAuth client with redirect URI `http://localhost:3000/callback` (or your client's local callback)
