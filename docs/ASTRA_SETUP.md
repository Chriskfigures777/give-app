# Astra Finance Setup (Credit Card Processor + OAuth)

This guide covers configuring **Astra Finance** as your credit card processor and OAuth provider for the banking app, alongside **Plaid** for bank linking and **Supabase OAuth** for third-party app authorization.

---

## Overview

| Service | Purpose |
|---------|---------|
| **Astra** | Credit card processing, OAuth for card linking (COLLECT_AUTHORIZATION, LINK_CARD) |
| **Plaid** | Bank account linking (Dwolla Secure Exchange) |
| **Supabase OAuth** | Your app as OAuth provider for third-party apps ("Sign in with Give") |

---

## 1. Astra Dashboard Configuration

**Sandbox:** [https://dashboard-sandbox.astra.finance/](https://dashboard-sandbox.astra.finance/)  
**Production:** [https://dashboard.astra.finance/](https://dashboard.astra.finance/)

### OAuth Redirect URI (Callback)

Where Astra redirects users after completing auth in the Astra Web SDK (e.g. card linking, authorization).

| Environment | Redirect URI |
|-------------|--------------|
| **Localhost** | `http://localhost:3000/api/astra/callback` |
| **Production** | `https://your-domain.com/api/astra/callback` |

Add both to your **Developer Account** settings in the Astra Dashboard. The `redirect_uri` you pass to `Astra.create()` must match exactly.

### Webhook URL

Astra sends automation and payment events here. **Must be HTTPS** (localhost won't work—use [ngrok](https://ngrok.com) for local testing).

| Environment | Webhook URL |
|-------------|-------------|
| **Localhost** | `https://your-ngrok-url.ngrok.io/api/webhooks/astra` |
| **Production** | `https://your-domain.com/api/webhooks/astra` |

Configure in Astra Dashboard → **Webhooks** section.

---

## 2. Plaid Configuration

**Dashboard:** [https://dashboard.plaid.com](https://dashboard.plaid.com)

### Plaid Redirect URI

Used when Plaid Link uses redirect mode (e.g. OAuth for certain banks). Add to Plaid Dashboard → **API** → **Allowed redirect URIs**.

| Environment | Redirect URI |
|-------------|--------------|
| **Localhost** | `http://localhost:3000/api/plaid/callback` |
| **Production** | `https://your-domain.com/api/plaid/callback` |

**Note:** If you use Plaid Link in "update" mode only (no redirect), this may be optional. The `create-link-token` API uses `PLAID_REDIRECT_URI` when provided.

---

## 3. Supabase OAuth (Your App as Provider)

**Dashboard:** Supabase → Authentication → OAuth Server

For third-party apps to use "Sign in with [Your App]":

| Setting | Localhost | Production |
|---------|-----------|------------|
| **Site URL** | `http://localhost:3000` | `https://your-domain.com` |
| **Redirect URLs** | `http://localhost:3000/**` | `https://your-domain.com/**` |

When registering OAuth clients, use redirect URIs like:
- `http://localhost:3000/callback` (for local testing)
- `https://client-app.com/callback` (for production clients)

---

## 4. Environment Variables

Add to `.env.local` (and Vercel for production):

```bash
# ── Astra (credit card processor) ──
ASTRA_CLIENT_ID=your_astra_client_id
ASTRA_CLIENT_SECRET=your_astra_client_secret   # Also used for webhook verification
NEXT_PUBLIC_ASTRA_CLIENT_ID=your_astra_client_id   # For Astra Web SDK (client-side)

# ── Plaid (bank linking) ──
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
PLAID_REDIRECT_URI=http://localhost:3000/api/plaid/callback   # or production URL

# ── App URLs (used for callbacks) ──
NEXT_PUBLIC_APP_URL=http://localhost:3000   # or https://your-domain.com
DOMAIN=http://localhost:3000
```

---

## 5. URL Quick Reference

| Use Case | Localhost | Production |
|----------|-----------|------------|
| **Astra OAuth callback** | `http://localhost:3000/api/astra/callback` | `https://your-domain.com/api/astra/callback` |
| **Astra webhook** | Use ngrok (HTTPS required) | `https://your-domain.com/api/webhooks/astra` |
| **Plaid redirect** | `http://localhost:3000/api/plaid/callback` | `https://your-domain.com/api/plaid/callback` |
| **Supabase OAuth consent** | `http://localhost:3000/oauth/consent` | `https://your-domain.com/oauth/consent` |

---

## 6. Astra Web SDK Usage

When initializing the Astra Web SDK, pass the matching `redirectUri`:

```javascript
const handler = Astra.create({
  clientId: process.env.NEXT_PUBLIC_ASTRA_CLIENT_ID,
  redirectUri: `${window.location.origin}/api/astra/callback`,
  actionType: "COLLECT_AUTHORIZATION",  // or "LINK_CARD"
  onAuth: (code, state) => {
    // Called when auth completes (iframe flow)
    // Or user is redirected to redirectUri with ?code=xxx&state=xxx
  },
  onClose: () => {},
  onError: (err) => console.error(err),
});
handler.open();
```

---

## 7. Localhost Webhook Testing

Astra webhooks require HTTPS. For local development:

1. Run [ngrok](https://ngrok.com): `ngrok http 3000`
2. Use the ngrok URL in Astra Dashboard: `https://xxxx.ngrok.io/api/webhooks/astra`
3. Ensure `ASTRA_CLIENT_SECRET` is set for signature verification

---

## References

- [Astra Webhooks](https://docs.astra.finance/reference/webhooks)
- [Astra Webhook Verification](https://docs.astra.finance/reference/webhook-verification)
- [Astra OAuth Links and Parameters](https://docs.astra.finance/reference/oauth-links-and-parameters)
- [Astra Web App SDK](https://docs.astra.finance/reference/astra-web-app-sdk)
- [OAUTH_SERVER_SETUP.md](./OAUTH_SERVER_SETUP.md) — Supabase OAuth provider
- [UNIT_BANKING_SETUP.md](./UNIT_BANKING_SETUP.md) — Unit banking
