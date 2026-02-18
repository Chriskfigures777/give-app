# Dwolla Splits Architecture — Critical Considerations

This document addresses timing, liquidity, error handling, reconciliation, and rollout for the Stripe + Dwolla split distribution system.

---

## 1. Timing and Liquidity (HIGHEST PRIORITY)

### Problem

Stripe payouts typically take **2–7 days** to reach the bank account, but the webhook triggers Dwolla transfers immediately on `payment_intent.succeeded`.

### Solutions

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A: Wait for payout** | Trigger Dwolla only on `payout.paid` | No liquidity risk | 2–7 day delay before splits |
| **B: Stripe Instant Payouts** | Use instant payouts (if eligible) | Faster | Fees per payout |
| **C: Working capital buffer** | Pre-fund Dwolla-linked bank; execute immediately | Immediate splits | Requires buffer; reconciliation complexity |

### Recommendation

- **Start with Option C** (buffer) for immediate execution.
- Add `payout.paid` webhook handling to reconcile and ensure sufficient balance.
- Document buffer requirements and monitor balance.

### Implementation Notes

```typescript
// Future: payout.paid webhook handler
case 'payout.paid':
  // Funds now in bank — optionally trigger pending transfers
  // or run reconciliation job
  await reconcilePendingSplitsForPayout(payout.id);
```

---

## 2. Funding Model: Platform vs Per-Org

### Option A: Platform Master Account

- Stripe → Platform bank → Dwolla balance
- All splits pull from platform account
- **Simpler** initially
- Platform holds funds temporarily

### Option B: Per-Organization Accounts

- Stripe → Church bank → Dwolla balance
- Each org’s splits pull from their own account
- **Current implementation** (Connect account = church’s bank)
- Requires each org to link their bank via Plaid for Dwolla

### Current State

The implementation uses **Option B** (per-org): each org links their bank via Plaid; Dwolla uses `organizations.dwolla_source_funding_source_url` as the source. Funds flow: Stripe charge → Connect account → Stripe payout → church’s bank → Dwolla pulls from that bank.

**Timing**: Stripe payout to the church’s bank is typically T+2. Dwolla transfers are initiated on `payment_intent.succeeded`, so they may run before funds arrive. Options:

1. **Buffer**: Org maintains a buffer in their bank.
2. **Deferred execution**: Queue transfers and run them on `payout.paid` or a scheduled job after payout.
3. **Platform master**: Switch to Option A so platform holds funds and distributes.

---

## 3. Dwolla Webhook Handler

**Implemented**: `src/app/api/webhooks/dwolla/route.ts`

- Verifies `X-Request-Signature-SHA-256` (HMAC SHA-256)
- Handles: `transfer:created`, `transfer:pending`, `transfer:processed`, `transfer:failed`, `transfer:returned`
- Updates `dwolla_transfers.status` from webhook events
- Idempotency via `dwolla_webhook_events` table

**Setup**:

1. Create webhook subscription in [Dwolla Dashboard](https://dashboard-sandbox.dwolla.com) (or production).
2. URL: `https://your-domain.com/api/webhooks/dwolla`
3. Set `DWOLLA_WEBHOOK_SECRET` in `.env.local` (same value used when creating the subscription).

---

## 4. Retry Logic (Database Ready)

`dwolla_transfers` has:

- `retry_count`, `max_retries`, `next_retry_at`
- `error_message` for failure details

**Suggested retry flow**:

```typescript
// Future: src/lib/dwolla/retry-transfers.ts
async function retryFailedTransfers() {
  const failed = await getTransfersForRetry(); // status=failed, retry_count < max_retries
  for (const t of failed) {
    await sleep(exponentialBackoff(t.retry_count));
    await attemptDwollaTransfer(t);
  }
}
```

Run via cron or Vercel cron.

---

## 5. Reconciliation

**Table**: `split_reconciliation`

- `donation_id`, `stripe_amount_cents`, `total_splits_amount_cents`
- `reconciliation_difference_cents`, `all_transfers_completed`
- `reconciled_at`, `notes`

**Suggested daily job**:

1. Sum `dwolla_transfers.amount_cents` per donation.
2. Compare to `donations.amount_cents`.
3. Flag discrepancies > $0.01.
4. Generate reconciliation report.

---

## 6. ACH Timing (User-Facing)

Display in the splits configuration UI:

```
ACH Transfer Timeline:
• Payment received: Immediately
• Splits initiated: Within 24 hours
• Funds available: 3–5 business days
• Total timeline: 3–6 business days
```

---

## 7. Fee Structure

**Dwolla**: ~$0.50 per ACH transfer.

**Example**: $100 donation split 3 ways:

- Stripe: $3.20 (2.9% + $0.30)
- Dwolla: $1.50 (3 × $0.50)
- **Total**: ~$4.70

**Decision needed**: Who pays Dwolla fees?

- Platform absorbs
- Recipient pays (deducted from split)
- Donor pays (added to donation)

---

## 8. Security and Verification

`split_bank_accounts` includes:

- `is_verified` (Plaid instant verification)
- `account_number_last4`, `routing_number_masked`

**Future enhancements**:

- Micro-deposit verification fallback
- Limits for new accounts
- Fraud flags (many banks, rapid changes)

---

## 9. Rollout Phases

| Phase | Duration | Actions |
|-------|----------|---------|
| **0** | Before Phase 1 | Dwolla sandbox, Plaid → Dwolla flow, document timing |
| **1–2** | 2–3 weeks | Database + backend |
| **3** | 1–2 weeks | UI |
| **4** | 2 weeks | Sandbox testing (E2E, failures, reconciliation) |
| **5** | 1 week | Limited beta (1–2 orgs, manual monitoring) |
| **Production** | — | Start with predictable orgs; keep Stripe Connect as backup for 30 days |

---

## 10. Environment Variables

```bash
# Dwolla
DWOLLA_ENV=sandbox
DWOLLA_KEY=
DWOLLA_SECRET=
DWOLLA_WEBHOOK_SECRET=

# Plaid (for bank linking)
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/app/api/webhooks/dwolla/route.ts` | Dwolla webhook handler |
| `src/lib/dwolla/client.ts` | Dwolla API client |
| `src/lib/dwolla/transfers.ts` | ACH transfer creation |
| `src/lib/split-disbursement.ts` | Split resolution and execution |
| `dwolla_webhook_events` | Webhook idempotency |
| `dwolla_transfers` | Transfer status, retry fields |
| `split_reconciliation` | Reconciliation tracking |
