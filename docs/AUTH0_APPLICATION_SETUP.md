# Auth0 Application Setup for Banking

If the Auth0 login page shows **"Auth0 Management API (Test Application)"**, you're using the wrong Client ID.

## Fix: Create a Dedicated Application

1. **Auth0 Dashboard** → **Applications** → **Applications**
2. Click **Create Application**
3. **Name**: e.g. "Give App" or "Give Banking"
4. **Application type**: **Single Page Application**
5. Click **Create**

## Configure the New Application

1. Copy the **Client ID** → set as `NEXT_PUBLIC_AUTH0_CLIENT_ID` in `.env.local`
2. **Application URIs** (see `AUTH0_APPLICATION_URIS.md`):
   - **Allowed Callback URLs**: `http://localhost:3000/auth/auth0-callback`
   - **Allowed Logout URLs**: `http://localhost:3000, http://localhost:3000/api/auth/signout`
   - **Allowed Web Origins**: `http://localhost:3000`

3. **Application Type**: Single Page Application
4. **Grant Types**: Enable **Authorization Code** and **Refresh Token**

## Create the API (for Unit Banking)

1. **Auth0 Dashboard** → **Applications** → **APIs** → **Create API**
2. **Name**: e.g. "Unit Banking"
3. **Identifier**: `https://unit-banking` (must match `NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE`)
4. Click **Create**
5. **APIs** → your API → **Machine to Machine Applications** → Authorize your new app

## Update .env.local

```env
NEXT_PUBLIC_AUTH0_DOMAIN=dev-xxxx.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=<your-new-app-client-id>   # NOT the Management API client
NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE=https://unit-banking
```

Restart the dev server after changing env vars.
