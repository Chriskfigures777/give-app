# Stripe Webhook Lambda – Testing Guide

## Your webhook URL

```
https://ldw5gnhkxfxamc73olftnaj5iy0uecfc.lambda-url.us-east-2.on.aws/
```

## Step 1: Add webhook in Stripe Dashboard

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. **Endpoint URL:** `https://ldw5gnhkxfxamc73olftnaj5iy0uecfc.lambda-url.us-east-2.on.aws/`
4. **Events to send:** Select:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `account.updated`
5. Click **Add endpoint**
6. Open the new endpoint and copy the **Signing secret** (starts with `whsec_`)

## Step 2: Update Lambda with the new signing secret

If this is a new endpoint, Stripe gives you a new signing secret. Update your Lambda:

1. Add the secret to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET="whsec_xxxx"   # from Stripe Dashboard
   ```

2. Redeploy the Lambda so it picks up the new secret:
   ```bash
   export AWS_ACCESS_KEY_ID="your_key"
   export AWS_SECRET_ACCESS_KEY="your_secret"
   pnpm run deploy:lambda
   ```

## Step 3: Test with Stripe CLI

```bash
# Forward test events to your Lambda (uses Stripe CLI's temporary secret)
stripe listen --forward-to https://ldw5gnhkxfxamc73olftnaj5iy0uecfc.lambda-url.us-east-2.on.aws/
```

In another terminal:

```bash
# Trigger a test payment_intent.succeeded event
stripe trigger payment_intent.succeeded
```

**Note:** `stripe listen` creates a temporary webhook with its own signing secret. For this to work with your Lambda, the Lambda must use that secret. The CLI prints something like `Ready! Your webhook signing secret is whsec_xxx` – you’d need to update the Lambda env and redeploy, or use the Dashboard endpoint (Step 1) instead.

## Step 3 (alternative): Test via Stripe Dashboard

1. After adding the endpoint (Step 1), open it in the Dashboard
2. Click **Send test webhook**
3. Choose `payment_intent.succeeded` and click **Send test webhook**
4. Check the response – you should see a 200 and `{"received":true}`

## Step 4: Verify Supabase

After a successful webhook:

1. Open your Supabase project → Table Editor
2. Check the `donations` table for new rows
3. In your app, open the Donations dashboard – it should update in real time via Supabase Realtime

## Quick curl test (no signature)

```bash
curl -X POST "https://ldw5gnhkxfxamc73olftnaj5iy0uecfc.lambda-url.us-east-2.on.aws/" \
  -H "Content-Type: application/json" -d '{}'
# Expected: {"error":"No signature"} with HTTP 400
```

This confirms the Lambda is reachable and correctly rejects unsigned requests.
