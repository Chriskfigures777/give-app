# Internal Splits — Design Doc

## What the user wants

**Internal splits within an organization** — when a donation comes in, automatically split it to different bank accounts that the org has **already connected** to their Stripe Connect account during onboarding.

- **Not** splitting to other organizations
- **Not** Plaid/Dwolla or external bank linking
- **Yes** — use the bank accounts the org added when they connected via Stripe
- **Yes** — automate so the org doesn't have to manually transfer funds in their Connect account

## How Stripe supports this

1. **External accounts** — A Connect account can have multiple external accounts (bank accounts) for payouts. These are added during Connect onboarding or later.

   **Platform setting required:** To allow connected accounts to add more than one bank account, the platform must enable **"Collect multiple external accounts per currency"** in Stripe Dashboard → Settings → Connect → Payouts → [External Accounts](https://dashboard.stripe.com/settings/connect/payouts/external_accounts). If this is disabled, adding a new account replaces the existing one.

2. **Payouts API** — The platform can create payouts from a Connect account's balance to a **specific** external account using the `destination` parameter:

   ```js
   stripe.payouts.create(
     { amount: 7000, currency: "usd", destination: "ba_xxx" },
     { stripeAccount: connectAccountId }
   );
   ```

3. **Flow** — Donation → charge lands in org's Connect balance → platform creates multiple payouts from that balance to different external accounts (e.g., 70% to Operating, 20% to Building Fund, 10% to Missions).

## Implementation plan

### 1. Fetch org's external accounts

- API: `stripe.accounts.retrieve(connectAccountId)` or `stripe.accounts.listExternalAccounts(connectAccountId)`
- Returns bank accounts the org connected (id, last4, bank_name, etc.)
- Use for split configuration UI

### 2. Store internal split configuration

- New table or extend `form_customizations` / org settings
- Schema: `{ percentage: number; externalAccountId: string }[]` (e.g. `ba_xxx`)
- Must total 100%
- All `externalAccountId` must belong to the org's Connect account

### 3. Charge flow

- **Option A (direct charge):** Charge on Connect account → funds land in org balance → create payouts
- **Option B (destination charge):** Charge on platform → transfer to Connect account → create payouts

For internal splits, we need funds in the org's Connect balance. Current flow may use destination charges for cross-org splits. For internal splits, we can:
- Use direct charge on Connect account (simplest — funds land directly)
- Or destination charge + single transfer to Connect, then payouts

### 4. Webhook: create payouts after charge

On `payment_intent.succeeded` when internal splits are configured:

1. Verify charge landed in org's Connect balance (or transfer first if needed)
2. For each split: `stripe.payouts.create({ amount, currency, destination: externalAccountId }, { stripeAccount })`
3. Idempotency: track which payment intents we've already created payouts for

### 5. UI

- **Settings or Connect section:** "Internal splits" or "Split to your accounts"
- List org's external accounts (from Stripe)
- Let org configure: "70% → Chase Operating ****1234", "20% → Building Fund ****5678", etc.
- Save to DB

### 6. Edge cases

- **Payout timing:** Payouts are typically 2–3 business days. Org sees them as separate deposits.
- **Insufficient balance:** If balance isn't available yet (e.g. charge pending), payouts fail. May need to queue and retry or use a different flow.
- **Default payout:** Stripe normally auto-payouts to default account. Creating manual payouts to specific accounts should work; verify Stripe doesn't double-payout.

## Next steps

1. Add API to fetch org's external accounts from Stripe
2. Add internal split configuration (DB + UI)
3. Update charge/payment flow to support internal splits
4. Update webhook to create payouts to specified external accounts when internal splits are configured
