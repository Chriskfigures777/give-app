# Give — Donations for Churches & Nonprofits

Next.js (App Router) + pnpm + Supabase + Stripe Connect Express. Fast, minimal, production-oriented.

## Stack

- **Next.js 15** (App Router)
- **pnpm**
- **Supabase** (Auth + Postgres)
- **Stripe Connect Express** (silent, backend-only)
- **shadcn/ui** + Radix, Zustand only where needed

## Setup

1. **Install**
   ```bash
   pnpm install
   ```

2. **Env**
   Copy `.env.local` and ensure:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (same value as Stripe publishable key for client-side Stripe.js)

3. **Stripe webhook**
   - Endpoint: `POST /api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET` to the signing secret

4. **Run**
   ```bash
   pnpm dev
   ```

## Structure

- `src/app/` — App Router pages and API routes
- `src/app/api/create-payment-intent/` — create PaymentIntent (1% platform fee, transfer to org Connect account)
- `src/app/api/webhooks/stripe/` — handle payment success/failure, insert donation, transfer 30% of platform fee to endowment
- `src/app/dashboard/` — authenticated dashboard (overview, donations, settings)
- `src/app/give/[slug]/` — public donation page by org slug
- `src/lib/` — Supabase clients, auth helpers, Stripe (client, connect, constants)
- `New Dashbord/` — existing Toolscript dashboard (layout/styling reference; not removed)

## Fees

- **Platform fee**: 1% of each payment (Stripe `application_fee_amount`)
- **Endowment**: 30% of that 1% is transferred to the selected endowment fund’s Connect account (in webhook, single path)

## Continuation

When you say **"continue"**, the agent will re-scan the repo, verify Stripe/Supabase/dashboards, and fix or improve as needed. See `.prompts/01-continue.md`.
