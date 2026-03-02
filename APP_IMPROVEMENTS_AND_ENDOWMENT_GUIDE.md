# Give Platform — Feature Additions & Endowment Fund Setup Guide

## Part 1: Features to Add for a Production-Ready App

### High Priority (Core UX)

| Feature | Why It Matters |
|---------|----------------|
| **Recurring donations** | Churches/nonprofits rely heavily on recurring giving. `donation_campaigns.allow_recurring` exists but isn't wired up. Add Stripe Subscriptions or PaymentMethod + scheduled charges. |
| ** donor dashboard** | Givers need a place to see donation history, download tax receipts, manage recurring gifts. |
| **Tax receipts / year-end statements** | Essential for nonprofits. Generate PDFs per donation or annual summary. |
| **Email receipts** | Send confirmation email after donation (Stripe Receipts or custom email). |
| **Admin: Endowment fund management** | Platform admins need UI to create endowment funds and attach Connect accounts. See Part 2. |

### Popular & Expected Features

| Feature | Notes |
|---------|-------|
| **Embeddable widget** | You have `embed/` — make it easy to copy a snippet or iframe for churches to embed on their site. |
| **QR codes** | Generate QR codes for donation pages (e.g. for in-person giving). |
| **Multiple campaigns per org** | Already supported; ensure the UI makes it easy to create and manage. |
| **Suggested amounts per campaign** | `suggested_amounts` in campaigns; ensure form uses them. |
| **Anonymous donations** | `allow_anonymous` exists; ensure donor info can be optional. |
| **“Cover the fees”** | Already in donation form; keep it prominent. |
| **Donor-optional endowment selection** | `show_endowment_selection` in form customization; donors pick which endowment gets 30% of platform fee. |

### Growth & Engagement

| Feature | Notes |
|---------|-------|
| **Thank-you page customization** | Per-org message, maybe a video or link. |
| **Social sharing** | “Share that you gave” (optional, privacy-first). |
| **Recurring reminder emails** | “You haven’t given this month” (opt-in). |
| **Campaign goals / progress bars** | Show progress toward `goal_amount_cents`. |
| **Leaderboard (opt-in)** | Aggregate “X people gave this month” without exposing names. |

### Platform Admin

| Feature | Notes |
|---------|-------|
| **Manage endowment funds** | Create, edit, attach Connect accounts. |
| **Platform analytics** | Total volume, fees, endowment transfers. |
| **Organization verification** | Approve/reject orgs before they can receive donations. |
| **Support tools** | Search donations, orgs, users. |

### Technical & Reliability

| Feature | Notes |
|---------|-------|
| **Webhook retries** | Ensure idempotency; don’t double-insert donations. |
| **Stripe Connect: `account.updated`** | Already handled; keep syncing `onboarding_completed`. |
| **Refunds** | Not supported — do not add `charge.refunded` webhook handling. |
| **Test mode vs live** | Clear separation in env and Stripe keys. |

---

## Part 2: Endowment Fund Accounts — How They Work

### Key Concept: Two Different Types of Entities

| Entity | Purpose | Connect Account? | Who Creates It? |
|--------|---------|------------------|-----------------|
| **Organization** (church/nonprofit) | Receives donations; runs campaigns | Yes — `organizations.stripe_connect_account_id` | Org admin signs up; app creates Connect account + onboarding |
| **Endowment Fund** | Receives 30% of platform fee from each donation | Yes — `endowment_funds.stripe_connect_account_id` | Platform admin creates fund + Connect account |

### Are Endowment Funds “Connect accounts” or Separate?

**Both organizations and endowment funds use Stripe Connect accounts.** They are separate Connect accounts:

- **Organization Connect account** → Receives the donation (minus platform fee).
- **Endowment Fund Connect account** → Receives 30% of the 1% platform fee via Stripe transfers.

The difference is:

- **Organizations** are created by users (org admins) who go through Connect onboarding.
- **Endowment funds** are created by platform admins and are platform-owned; no end-user logs into them.

### How to Set Up an Endowment Fund

1. **Create the endowment fund record** in `endowment_funds`:
   - `name`, `description`
   - `stripe_connect_account_id` = `null` initially

2. **Create a Stripe Connect account for the fund** (same API as orgs):
   ```ts
   const account = await stripe.accounts.create({
     type: "custom",
     country: "US",
     email: "platform@yourdomain.com",  // platform-managed
     capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
     metadata: { endowment_fund_id: fundId },
     business_profile: {
       name: "General Endowment Fund",
       mcc: "8398",  // or appropriate MCC
     },
   });
   ```

3. **Update the endowment fund** with `stripe_connect_account_id`:
   ```ts
   await supabase.from("endowment_funds").update({
     stripe_connect_account_id: account.id,
     updated_at: new Date().toISOString(),
   }).eq("id", fundId);
   ```

4. **Complete Connect onboarding for the endowment account** (if Stripe requires it before receiving transfers). You can use the same embedded onboarding flow but with the endowment’s `stripe_connect_account_id`. Platform admins would run this, not donors.

### Current State in Your App

- `endowment_funds` table exists with `stripe_connect_account_id`.
- One row: “General Endowment” with `stripe_connect_account_id: null`.
- **Effect:** The webhook will not transfer the 30% share to any endowment because there is no Connect account. You need to create a Connect account for each endowment fund and store its ID.

### Do I Create It in Stripe or in the App?

**Both:**

1. **In the app (Supabase):** Create the `endowment_funds` row (name, description).
2. **In Stripe:** Create the Connect account via API.
3. **Back in the app:** Save `stripe_connect_account_id` on the endowment fund.

### Separate from Organizations?

Yes. Endowment funds are **separate** from organizations:

- Organizations → User-facing; org admins manage them.
- Endowment funds → Platform-level; platform admins manage them.

Both need Connect accounts because both receive money:

- Orgs receive donations.
- Endowment funds receive 30% of the platform fee (via `stripe.transfers.create`).

### Suggested Flow for Platform Admins

1. Add an **Admin → Endowment Funds** section.
2. **Create Endowment Fund:**
   - Name, description.
   - On save: create Connect account, then update `endowment_funds.stripe_connect_account_id`.
3. **Complete onboarding** (if required):
   - “Complete verification” button that opens Connect embedded onboarding for that endowment’s account.
4. Do **not** expose endowment account management to org admins; only platform admins.

---

## Part 3: Quick Reference

| Question | Answer |
|----------|--------|
| **Connect or separate?** | Endowment funds use their own Connect accounts (separate from org Connect accounts). |
| **Where do I create it?** | In the app: endowment record. In Stripe: Connect account via API. Then link them. |
| **Who manages it?** | Platform admins only. |
| **Does the org “own” the endowment?** | No. Endowment funds are platform-level and shared across all orgs. |
| **How does the app know it’s an endowment?** | `endowment_funds` table; `stripe_connect_account_id` must be set for transfers to work. |
