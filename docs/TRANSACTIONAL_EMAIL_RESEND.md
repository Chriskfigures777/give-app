# Transactional Email (Resend)

Production-ready transactional emails via Resend. Event-driven, backend-only, idempotent.

---

## Environment Variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `RESEND_API_KEY` | Yes (for emails) | Resend API key. Get from [resend.com](https://resend.com). Never expose to client. |
| `RESEND_FROM_EMAIL` | No | Sender address. Default: `Give <onboarding@resend.dev>`. Use a verified domain for production. |
| `NEXT_PUBLIC_APP_URL` or `DOMAIN` | Yes (for receipt links) | Base URL for receipt links, e.g. `https://yourdomain.com`. |

**Lambda:** Add `RESEND_API_KEY` and `NEXT_PUBLIC_APP_URL` to `.env.local` before running `deploy:lambda`. The deploy script passes them to the Lambda.

---

## Emails Implemented

### 1. Donation Received
- **Trigger:** Stripe `payment_intent.succeeded` (after donation insert)
- **Recipient:** Donor email
- **Content:** Amount, organization, date, confirmation

### 2. Receipt Attached
- **Trigger:** Same as above (after donation insert)
- **Recipient:** Donor email
- **Content:** Receipt ID, link to `/receipts/{id}`, tax disclaimer

### 3. Payout Processed
- **Trigger:** Stripe `payout.paid` (Connect accounts)
- **Recipient:** Organization owner email
- **Content:** Amount, destination, processing date. No donor details.

### 4. Confirm Your Email
- **Trigger:** User signup (Supabase Auth)
- **Setup:** Configure Resend SMTP in Supabase Auth so Supabase sends through Resend.

---

## Confirm Email Setup (Supabase + Resend)

Supabase Auth sends confirmation emails. To use Resend:

1. **Supabase Dashboard** → Authentication → Providers → Email
2. **Custom SMTP** → Enable
3. **Host:** `smtp.resend.com`
4. **Port:** `465` (SSL)
5. **Username:** `resend`
6. **Password:** Your Resend API key (`re_...`)
7. **Sender email:** Use a verified domain (e.g. `noreply@yourdomain.com`)

Supabase will send confirmation emails through Resend. Customize the template in Supabase Auth → Email Templates.

For custom invite flows, use `sendConfirmEmail()` from `@/lib/email/send-transactional` with a generated link.

---

## Retry Safety and Idempotency

- **Stripe webhooks** retry on non-2xx. Emails are sent only after DB writes succeed.
- **`email_sends` table** tracks sent emails. Duplicate sends are skipped by `(entity_type, entity_id, email_type)`.
- **Email failure** does not fail the webhook. We log and continue. Payments always succeed.
- **Lambda:** Same idempotency. RESEND_API_KEY optional; if missing, emails are skipped.

---

## Trigger Points

| Location | Events |
| -------- | ------ |
| `src/app/api/webhooks/stripe/route.ts` | payment_intent.succeeded, invoice.paid, payout.paid |
| `lambda/stripe-webhook/src/index.ts` | Same (when using Lambda) |

---

## Receipt URL

Receipt link: `{APP_URL}/receipts/{donationId}`. Requires auth; donor must sign in with the email used for the donation.
