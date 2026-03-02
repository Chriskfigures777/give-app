# AWS Services — Give App

A list of AWS services you use and could adopt for the Give donation platform.

---

## Currently Using

| Service | What For |
| ------- | -------- |
| **Lambda** | Runs Stripe webhook handler (payment processing, Supabase updates) |
| **Lambda Function URLs** | Public HTTPS endpoint for Stripe to send webhooks |
| **IAM** | Role and permissions for Lambda (`stripe-webhook-lambda-role`) |
| **CloudWatch Logs** | Lambda execution logs (errors, debug) |
| **Service Quotas** | Concurrency limit (1,000 concurrent executions) |

---

## Could Adopt (Future Use)

| Service | What For |
| ------- | -------- |
| **S3** | Store uploaded images/videos (org pages, Pexels fallback), receipts, exports |
| **CloudFront** | CDN for static assets, faster global delivery |
| **SES (Simple Email Service)** | Transactional email (receipts, notifications) instead of third-party |
| **SNS** | Push notifications, alerts (e.g., donation received) |
| **EventBridge** | Schedule jobs (e.g., year-end receipt generation, reports) |
| **API Gateway** | REST APIs if you move more backend logic off Next.js |
| **Cognito** | User auth (you use Supabase Auth today) |
| **Secrets Manager** | Store API keys, webhook secrets (instead of env vars) |
| **WAF (Web Application Firewall)** | Protect app from common attacks |
| **Route 53** | DNS if you host on AWS |
| **Amplify** | Host Next.js app (alternative to Vercel) |

---

## Summary by Category

| Category | In Use | Could Use |
| -------- | ------ | --------- |
| **Compute** | Lambda | — |
| **Storage** | — | S3 |
| **Networking** | — | CloudFront, Route 53 |
| **Security** | IAM | Secrets Manager, WAF |
| **Monitoring** | CloudWatch Logs | — |
| **Email** | — | SES |
| **Auth** | — | Cognito (you use Supabase) |
| **Hosting** | — | Amplify (you use Vercel) |

---

## What You Need Right Now

For the current Give app:

- **Lambda** — Webhook processing
- **Lambda Function URLs** — Webhook endpoint
- **IAM** — Lambda permissions
- **CloudWatch** — Logs and debugging

Everything else (Supabase, Stripe, Vercel) covers database, payments, and hosting. AWS is focused on reliable, scalable webhook handling.
