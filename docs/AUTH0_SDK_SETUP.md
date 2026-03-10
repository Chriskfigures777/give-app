# Auth0 SDK Setup Guide for Give App

This guide walks you through installing and configuring the Auth0 React SDK in the Give app, using your Auth0 Application configuration.

---

## 1. Install the Auth0 React SDK

The SDK is already installed. If you need to reinstall or upgrade:

```bash
pnpm add @auth0/auth0-react@2.x
```

---

## 2. Auth0Provider Configuration

The app wraps the root layout with `Auth0Provider` in `src/components/auth0-provider.tsx`. It uses environment variables and is configured for:

- **Banking (Unit)**: Auth0 tokens are used for Unit banking; Unit validates JWTs via Auth0's JWKS.
- **Callback**: Auth0 redirects to `/auth/auth0-callback` (not the root) to avoid conflicts with Supabase auth.
- **SSR-safe**: Uses `typeof window !== "undefined"` for `redirect_uri` so it works during server render.

Required props:

| Prop | Value |
|------|-------|
| `domain` | Your Auth0 tenant domain |
| `clientId` | Your Auth0 Application Client ID |
| `authorizationParams.redirect_uri` | `{origin}/auth/auth0-callback` |
| `authorizationParams.audience` | Optional: `https://unit-banking` (for Unit banking API) |

---

## 3. Environment Variables

Add these to `.env.local`:

```env
# Auth0 (for Unit banking)
NEXT_PUBLIC_AUTH0_DOMAIN=dev-xu3cgr3v5sc87jnp.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=uvrWTp16gGHe4NIkZGfz9gY3icT1vUBV

# Optional: Unit banking API audience (if using Unit with Auth0)
NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE=https://unit-banking

# App URL (used for redirect_uri when window is undefined)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://theexchangeapp.church`).

---

## 4. Auth0 Application URIs (Required)

In **Auth0 Dashboard → Applications → [Your App] → Application URIs**, configure:

### Allowed Callback URLs

Auth0 redirects here after login. **Must include `/auth/auth0-callback`.**

```
http://localhost:3000/auth/auth0-callback, https://theexchangeapp.church/auth/auth0-callback
```

### Allowed Logout URLs

Auth0 redirects here after logout. Include both the base URL and the signout endpoint.

```
http://localhost:3000, http://localhost:3000/api/auth/signout, https://theexchangeapp.church, https://theexchangeapp.church/api/auth/signout
```

### Allowed Web Origins

Required for CORS and silent token renewal. **Include both localhost and production.**

```
http://localhost:3000, https://theexchangeapp.church
```

### Application Type

- **Single Page Application** ✓

### Token Endpoint Authentication Method

- **None** ✓ (for public SPA)

---

## 5. Using Auth0 in Components

Use the `useAuth0()` hook in client components:

```tsx
"use client";

import { useAuth0 } from "@auth0/auth0-react";

function MyComponent() {
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect: login,
    logout: auth0Logout,
    user,
    getAccessTokenSilently,
  } = useAuth0();

  const signup = () =>
    login({ authorizationParams: { screen_hint: "signup" } });

  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  if (isLoading) return <div>Loading...</div>;

  return isAuthenticated ? (
    <>
      <p>Logged in as {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </>
  ) : (
    <>
      {error && <p>Error: {error.message}</p>}
      <button onClick={signup}>Signup</button>
      <button onClick={login}>Login</button>
    </>
  );
}
```

**Note:** `useAuth0` and `Auth0Provider` require client components (`"use client"`). Do not use `window` or other browser APIs in server components.

---

## 6. Banking Flow (Unit)

For the banking page (`/dashboard/banking`):

1. User visits banking → sees "Sign in / Sign up" if not authenticated.
2. Clicks sign in → `loginWithRedirect({ appState: { returnTo: "/dashboard/banking" } })`.
3. Auth0 redirects to Universal Login.
4. After login, Auth0 redirects to `/auth/auth0-callback`.
5. Callback page calls `handleRedirectCallback()` then redirects to `returnTo` (e.g. `/dashboard/banking`).
6. Banking page fetches Unit customer token via `/api/unit/customer-token` with the Auth0 access token.

---

## 7. Verify Setup

1. Ensure `.env.local` has `NEXT_PUBLIC_AUTH0_DOMAIN` and `NEXT_PUBLIC_AUTH0_CLIENT_ID`.
2. Ensure Auth0 Application URIs (Callback, Logout, Web Origins) are configured.
3. Run `pnpm dev` and open `http://localhost:3000`.
4. Go to `/dashboard/banking` and click "Sign in / Sign up".
5. Complete login on Auth0 Universal Login.
6. You should be redirected back to `/dashboard/banking`.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| Callback mismatch | Add `http://localhost:3000/auth/auth0-callback` to Allowed Callback URLs. |
| Invalid state | Ensure you're not using the Management API app; use your own SPA application. |
| Logout doesn't redirect | Add `http://localhost:3000/api/auth/signout` to Allowed Logout URLs. |
| CORS / silent renewal fails | Add `http://localhost:3000` to Allowed Web Origins. |
| JWT kid not found (Unit) | Ensure you're using tokens from your SPA app, not the Management API. |
