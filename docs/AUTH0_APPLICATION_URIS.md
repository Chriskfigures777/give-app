# Auth0 Application URIs for Banking

Use these values in Auth0 Dashboard → Applications → [Your App] → Application URIs.

## Application Login URI

```
https://give-app78.vercel.app/login
```

For local dev, you can also add:
```
http://localhost:3000/login
```

## Allowed Callback URLs

Comma-separated list. Auth0 redirects here after login. The Auth0 React SDK uses `window.location.origin` by default.

```
http://localhost:3000, https://give-app78.vercel.app
```

Add any other domains where your app runs (e.g. preview deployments).

## Allowed Logout URLs

Comma-separated list. Auth0 redirects here after logout.

```
http://localhost:3000, https://give-app78.vercel.app
```

## Allowed Web Origins

Comma-separated list. Required for CORS when using Auth0 in the browser.

```
http://localhost:3000, https://give-app78.vercel.app
```

---

## Quick copy-paste

**Allowed Callback URLs:**
```
http://localhost:3000, https://give-app78.vercel.app
```

**Allowed Logout URLs:**
```
http://localhost:3000, https://give-app78.vercel.app
```

**Allowed Web Origins:**
```
http://localhost:3000, https://give-app78.vercel.app
```

**Application Login URI:**
```
https://give-app78.vercel.app/login
```
