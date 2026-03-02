# AWS Webhook Architecture — What AWS Does

A detailed explanation of how AWS handles Stripe webhooks in the Give platform.

---

## 1. AWS Lambda (The Function)

**What it is:** A serverless function — your code runs only when invoked. No server to manage.

**What it runs:** Your webhook handler in `lambda/stripe-webhook/src/index.ts`:

- Receives the HTTP request from Stripe
- Verifies the Stripe signature
- Parses the event type
- Calls Stripe API (transfers, invoices, etc.)
- Calls Supabase API (donations, campaigns, etc.)
- Returns a response (200 or 400)

**Configuration:**

| Setting   | Value      |
| --------- | ---------- |
| Runtime   | Node.js 20 |
| Timeout   | 30 seconds |
| Memory    | 256 MB     |
| Region    | us-east-2  |

**Environment variables** (passed from `.env.local` at deploy time):

- `STRIPE_SECRET_KEY` — For Stripe API calls
- `STRIPE_WEBHOOK_SECRET` — For signature verification
- `STRIPE_PUBLISHABLE_KEY` — Optional
- `SUPABASE_URL` — Supabase API endpoint
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase writes (donations, campaigns, etc.)

---

## 2. Lambda Function URL (The Endpoint)

**What it is:** A public HTTPS URL that directly invokes your Lambda — no API Gateway needed.

**Your URL:**

```
https://ldw5gnhkxfxamc73olftnaj5iy0uecfc.lambda-url.us-east-2.on.aws/
```

**How it works:**

1. Stripe sends a `POST` request to this URL
2. AWS routes the request to your Lambda
3. Lambda executes your handler
4. Lambda returns the response back to Stripe

**Auth:** `AuthType: "NONE"` — no AWS auth required. Anyone with the URL can call it. Security is enforced by your code via Stripe's webhook signature verification.

---

## 3. IAM Role (Permissions)

**Role name:** `stripe-webhook-lambda-role`

**Purpose:** Gives the Lambda permission to run and write logs.

**Policy attached:** `AWSLambdaBasicExecutionRole` — allows:

- Writing logs to CloudWatch
- Creating log streams

**Trust policy:** Only the Lambda service can assume this role.

---

## 4. Request Flow (Step by Step)

```
Stripe (payment succeeds)
    │
    │  POST /  (JSON body + Stripe-Signature header)
    ▼
AWS (us-east-2)
    │
    ├─► Lambda Function URL
    │       │
    │       ▼
    │   Lambda "stripe-webhook-handler"
    │       │
    │       ├─► Verify signature (STRIPE_WEBHOOK_SECRET)
    │       ├─► Parse event (payment_intent.succeeded, etc.)
    │       ├─► Call Stripe API (transfers, invoices, etc.)
    │       ├─► Call Supabase (donations, campaigns, etc.)
    │       │
    │       ▼
    │   Return 200 { received: true }
    │
    ▼
Stripe receives 200 → marks webhook as delivered
```

---

## 5. What the Lambda Does Per Event Type

| Event                         | Actions                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `payment_intent.succeeded`    | Inserts donation in Supabase, executes splits (Stripe transfers), updates campaigns, fund requests, endowment funds, donor saved orgs |
| `payment_intent.payment_failed` | Logs failure                                                         |
| `checkout.session.completed`  | Handles checkout completion                                            |
| `invoice.paid`                | Handles subscription invoices                                          |
| `customer.subscription.updated` / `deleted` | Updates subscription status in Supabase                    |
| `account.updated`             | Updates connected account info in Supabase                              |

---

## 6. Deploy Scripts (What They Call)

**`scripts/deploy-lambda.mjs`** uses:

- **LambdaClient** — Create/update function, set env vars
- **IAMClient** — Create role, attach policy
- **STSClient** — Get AWS account ID

**`scripts/create-lambda-url.mjs`** uses:

- **LambdaClient** — Create Function URL, add invoke permissions

---

## 7. Why AWS Instead of Next.js?

| Aspect        | Next.js Route      | AWS Lambda              |
| ------------- | ------------------ | ----------------------- |
| Availability | Tied to your app   | Independent of your app |
| Scaling      | Shares app resources | Scales per request    |
| Cost         | Part of app hosting | Pay per invocation    |
| Cold starts  | None               | ~200–500 ms            |
| Region       | Wherever app runs  | us-east-2               |

---

## 8. AWS Services Involved

| Service              | Purpose                                      |
| -------------------- | -------------------------------------------- |
| **Lambda**           | Runs your webhook handler                    |
| **Lambda Function URLs** | Public HTTPS endpoint for Stripe        |
| **IAM**              | Role and permissions for the function        |
| **CloudWatch Logs**  | Stores Lambda logs (if enabled)              |

No API Gateway, S3, or database — the Lambda talks directly to Stripe and Supabase.
