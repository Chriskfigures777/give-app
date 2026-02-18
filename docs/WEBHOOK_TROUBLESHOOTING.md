# Stripe Webhook Troubleshooting

## "I'm not seeing logs in Lambda"

### 1. Confirm Lambda is being invoked

The handler logs `[stripe-webhook] invoked` at the very start. If you don't see this in CloudWatch, the Lambda is **not** being invoked.

**Possible causes:**

- **Wrong webhook URL in Stripe** – The Connect webhook must point to your Lambda Function URL (e.g. `https://xxx.lambda-url.us-east-2.on.aws/`).
- **Connect webhook not created** – Direct charges on Connect accounts require a **Connect** webhook (`connect: true`), not a regular account webhook. Run: `node scripts/create-connect-webhook.mjs`
- **Webhook disabled** – In Stripe Dashboard → Developers → Webhooks, ensure the endpoint is enabled.

### 2. Where to find CloudWatch logs

- **Log group:** `/aws/lambda/stripe-webhook-handler`
- **Region:** `us-east-2` (same as the Lambda)

**Tail logs from terminal:**

```bash
node scripts/tail-lambda-logs.mjs
# or
aws logs tail /aws/lambda/stripe-webhook-handler --follow --region us-east-2
```

**In AWS Console:** CloudWatch → Log groups → `/aws/lambda/stripe-webhook-handler` → Log streams.

### 3. Webhook secret mismatch

Connect webhooks use a **different** signing secret than account webhooks. The Lambda supports multiple secrets:

- `STRIPE_WEBHOOK_SECRET` – primary (use your **Connect** webhook secret here for direct charges)
- `STRIPE_WEBHOOK_SECRET_1`, `STRIPE_WEBHOOK_SECRET_2` – optional, for account + Connect on same URL

1. Set the Connect webhook secret in `.env.local` (from `scripts/create-connect-webhook.mjs` output).
2. Redeploy after changing: `pnpm run deploy:lambda:full`

If the secret is wrong, you'll see `Invalid signature` in the logs (or Stripe will retry and eventually mark as failed).

### 4. Transactions not visible on Connect side

- **Direct charges** – The charge is on the connected account. Check the Connect account's Stripe Dashboard (or use Stripe API with `stripeAccount`).
- **Transfers** – Splits are executed as transfers from the form owner's Connect account to peer Connect accounts. Errors here surface as `Webhook processing error:` in CloudWatch.

---

## Quick checklist

| Check | Action |
|-------|--------|
| Lambda invoked? | Look for `[stripe-webhook] invoked` in CloudWatch |
| Correct region? | us-east-2 |
| Connect webhook? | Stripe Dashboard → Webhooks → endpoint has `connect: true` |
| Correct secret? | `STRIPE_WEBHOOK_SECRET` = Connect webhook secret |
| Redeployed after secret change? | `pnpm run deploy:lambda:full` |
