# Auth0 Application URIs for Banking

## ⚠️ Important: Use Your Own Application

**Do NOT use "Auth0 Management API (Test Application)"** — that is Auth0's built-in Management API app and is not meant for user login.

1. Go to **Auth0 Dashboard → Applications → Applications**
2. Click **Create Application**
3. Choose **Single Page Application**
4. Name it (e.g. "Give App" or "Give Banking")
5. Use that Application's **Client ID** in `.env.local` as `NEXT_PUBLIC_AUTH0_CLIENT_ID`

---

Use these values in Auth0 Dashboard → Applications → [Your App] → Application URIs.

## Application Login URI

```
https://theexchangeapp.church/login
```

For local dev, you can also add:
```
http://localhost:3000/login
```

## Allowed Callback URLs

Comma-separated list. Auth0 redirects here after login. **Must include the `/auth/auth0-callback` path.**

```
http://localhost:3000/auth/auth0-callback, https://theexchangeapp.church/auth/auth0-callback
```

Add any other domains where your app runs (e.g. preview deployments), each with `/auth/auth0-callback` appended.

## Allowed Logout URLs

Comma-separated list. Auth0 redirects here after logout. **Must include the signout URL** so Auth0 can redirect back after clearing its session.

```
http://localhost:3000, http://localhost:3000/api/auth/signout, https://theexchangeapp.church, https://theexchangeapp.church/api/auth/signout
```

Add any other domains where your app runs, each with both the base URL and `/api/auth/signout`.

## Allowed Web Origins

Comma-separated list. Required for CORS when using Auth0 in the browser.

```
http://localhost:3000, https://theexchangeapp.church
```

---

## Quick copy-paste

**Allowed Callback URLs:**
```
http://localhost:3000/auth/auth0-callback, https://theexchangeapp.church/auth/auth0-callback
```

**Allowed Logout URLs:**
```
http://localhost:3000, http://localhost:3000/api/auth/signout, https://theexchangeapp.church, https://theexchangeapp.church/api/auth/signout
```

**Allowed Web Origins:**
```
http://localhost:3000, https://theexchangeapp.church
```

**Application Login URI:**
```
https://theexchangeapp.church/login
```
