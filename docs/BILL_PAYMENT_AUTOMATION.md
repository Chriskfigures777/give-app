# Bill Payment Automation — Design Doc

## Overview

Automate bill payments for churches: a percentage of donations accumulates into a "bills fund," and when the fund reaches a threshold, automatically pay bills via ACH on the scheduled payment date.

**Critical rule:** Only pay when money is **actually in the account**. Never run a cron that assumes a payout has arrived. 1,000 churches × 10% with payment problems = overdrafts and fees.

**Stripe only. No Dwolla.**

---

## Flow

1. **Setup:** Church configures:
   - Percentage of donations that goes to bills fund (e.g. 15%)
   - Total bill amount (e.g. $5,000/month)
   - Payment threshold (e.g. pay when $2,500 accumulated = half of bills)
   - Payment date (e.g. 15th of month)
   - Bill payees (vendors, utilities) with bank details

2. **Accumulation:** Donations come in → Stripe Connect splits → portion goes to church, portion to bills fund Connect account (or dedicated sub-account)

3. **Trigger:** On payment date:
   - **Check actual balance** (Stripe Balance API)
   - If balance >= threshold → execute ACH payments to bill payees via Stripe OutboundPayment
   - If balance < threshold → skip, do not pay

4. **Execution:** Stripe OutboundPayment (Financial Accounts) — send ACH to external vendor bank accounts.

---

## Balance Check (Required)

**Never assume.** Always verify before paying.

| Source | How to check |
|--------|--------------|
| Stripe Connect account (bills fund) | `stripe.balance.retrieve({}, { stripeAccount: connectAccountId })` → use `available` |

**Logic:**
```
if (actualBalance >= billAmount && today === paymentDate) {
  executePayments(); // Stripe OutboundPayment
} else {
  skip(); // Do not pay
}
```

---

## Stripe OutboundPayment

- **Product:** Stripe Financial Accounts (Treasury)
- **API:** `OutboundPayment` — send from financial account to external bank (vendor)
- **Requires:** Financial Accounts setup for platform
- **Benefit:** All in Stripe; check Stripe balance before paying; no Dwolla

---

## Architecture

- Create a "bills" Connect account (or sub-account) per church
- Donation splits: X% to main church, Y% to bills fund
- Bills fund balance grows in Stripe
- Payment date: `stripe.balance.retrieve()` → if >= threshold → Stripe OutboundPayment to vendor banks

**Next step:** Verify Stripe Financial Accounts availability for Connect platforms and pricing.

---

## Implementation Principles

1. **Check actual balance** before every payment run
2. **Never cron for "payout should have arrived"** — too risky at scale
3. **Stripe only.** No Dwolla.
4. **Payment date + sufficient balance** = trigger. Both conditions required.
