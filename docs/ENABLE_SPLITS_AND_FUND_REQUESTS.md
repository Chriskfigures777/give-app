# Enable Splits & Fund Requests — AI Prompt & Reference

**Purpose:** This document is a detailed reference for re-enabling the payment splits and fund requests features. Use it as an AI prompt or manual when you're ready to turn these features on.

---

## Supabase MCP Server

This feature relies on Supabase for persistence. If you use the **Supabase MCP server**:

- **List tables:** `mcp_supabase_list_tables` — confirm `fund_requests`, `split_proposals`, `split_transfers`, `donation_links` exist.
- **Run SQL:** `mcp_supabase_execute_sql` — inspect or fix data.
- **Apply migrations:** `mcp_supabase_apply_migration` — add or alter tables if needed.
- **Generate types:** `mcp_supabase_generate_typescript_types` — refresh `src/types/supabase.ts` after schema changes.
- **Check logs:** `mcp_supabase_get_logs` — debug webhook or API issues.

The `split_proposals` table may not appear in generated types; the code uses `@ts-expect-error` for inserts/updates.

---

## Quick Enable (AI Instruction)

**Task:** Enable the splits and fund requests features in the Give platform.

**Action:** In `src/lib/feature-flags.ts`:

```ts
export const SPLITS_ENABLED = true;
export const FUND_REQUESTS_ENABLED = true;
// BANK_ACCOUNT_SPLITS_ENABLED = false by default (Stripe Connect only)
```

To enable Dwolla bank splits, also set `BANK_ACCOUNT_SPLITS_ENABLED = true`. After changing, run `pnpm build` to verify.

---

## What Each Feature Does

### SPLITS_ENABLED (Payment Splits)

- **Embed cards:** Org can configure a split so % of each donation goes to connected peer orgs.
- **Form customization:** Org can set splits on the default form/embed.
- **Donation links:** Org can create shareable links (e.g. `/give/{slug}?link={link-slug}`) that split donations across multiple orgs.
- **Webhook:** Stripe webhook splits the charge when `metadata.splits` is present; creates multiple Stripe transfers to connected accounts.
- **Payment flow:** When splits are used, the charge lands on the platform (no `transfer_data`); the webhook splits it.

### BANK_ACCOUNT_SPLITS_ENABLED (Dwolla Bank Splits)

- **Default:** `false`. Splits use **Stripe Connect only** (transfer to other orgs' Connect accounts).
- **When `true`:** Donation links can also split to bank accounts via Dwolla (requires Plaid/Dwolla setup).
- **When `false`:** Bank account split option is hidden; "Automatic splits" nav link is hidden; only Stripe Connect splits are available.

### FUND_REQUESTS_ENABLED (Fund Requests in Chat)

- **Chat UI:** Org owner can create a fund request in a chat thread (org-to-user or org-to-org).
- **Donate in chat:** User can fulfill a fund request via Stripe PaymentElement in a modal.
- **Webhook:** Updates `fund_requests.fulfilled_amount_cents` when `metadata.fund_request_id` is present.

---

## Complete File Reference

Every file that references `SPLITS_ENABLED`, `FUND_REQUESTS_ENABLED`, or the feature-flags module:

### 1. Feature flags (source of truth)

| File | Purpose |
|------|---------|
| `src/lib/feature-flags.ts` | Defines `SPLITS_ENABLED`, `BANK_ACCOUNT_SPLITS_ENABLED`, and `FUND_REQUESTS_ENABLED`. Splits use Stripe Connect by default; set `BANK_ACCOUNT_SPLITS_ENABLED = true` to enable Dwolla bank splits. |

### 2. Dashboard UI

| File | What it controls |
|------|------------------|
| `src/app/dashboard/messages/[threadId]/chat-thread-client.tsx` | Shows/hides: split proposals list, "Propose split" form, fund requests list, "Request funds" form. |
| `src/app/dashboard/embed/embed-cards-panel.tsx` | Shows/hides: "Payment splits" step in the embed card wizard. Adjusts step indices (totalSteps, splitsStepIndex). |
| `src/app/dashboard/embed/embed-form-client.tsx` | Shows/hides: "Payment splits" section (Add split, peer selection) in form customization. |
| `src/app/dashboard/customization/donate-button-form-selector.tsx` | Shows/hides: donation link options in the donate button selector (only "Default form" when disabled). |
| `src/app/dashboard/donation-links/page.tsx` | When disabled: renders `DonationLinksComingSoon` instead of `DonationLinksClient`. |
| `src/app/dashboard/donation-links/donation-links-coming-soon.tsx` | "Feature coming soon" placeholder when donation links are disabled. |
| `src/app/dashboard/donation-links/donation-links-client.tsx` | Full donation links UI (create, list, delete). No flag check—page.tsx handles routing. |
| `src/app/dashboard/connections/connections-client.tsx` | Description text. When disabled: "Search for organizations, send connection requests, and message once accepted." When enabled: add "Split transfers require mutual agreement in chat—both parties must accept before any transfer." |

### 3. API routes

| File | What it controls |
|------|------------------|
| `src/app/api/chat/fund-requests/route.ts` | POST: returns 403 when `FUND_REQUESTS_ENABLED` is false. |
| `src/app/api/chat/fund-requests/[id]/donate/route.ts` | POST: returns 403 when `FUND_REQUESTS_ENABLED` is false. |
| `src/app/api/chat/split-proposals/route.ts` | POST: returns 403 when `SPLITS_ENABLED` is false. |
| `src/app/api/chat/split-proposals/[id]/accept/route.ts` | POST: returns 403 when `SPLITS_ENABLED` is false. |
| `src/app/api/chat/split-proposals/[id]/reject/route.ts` | POST: returns 403 when `SPLITS_ENABLED` is false. |
| `src/app/api/donation-links/route.ts` | POST: returns 403 when `SPLITS_ENABLED` is false. |
| `src/app/api/form-customization/route.ts` | PATCH: when `splits` in body, if `SPLITS_ENABLED` is false, saves `splits: []`. |
| `src/app/api/embed-cards/[id]/route.ts` | PATCH: when `body.splits` present, if `SPLITS_ENABLED` is false, saves `splits: []`. |
| `src/app/api/webhooks/stripe/route.ts` | `payment_intent.succeeded`: Stripe Connect splits when `split_mode === 'stripe_connect'`; Dwolla splits only when `BANK_ACCOUNT_SPLITS_ENABLED && split_mode === 'bank_accounts'`. |

### 4. Payment & Stripe logic

| File | What it controls |
|------|------------------|
| `src/lib/stripe/create-payment-intent.ts` | Rejects `fundRequestId` when `FUND_REQUESTS_ENABLED` is false. Bank-account splits only when `BANK_ACCOUNT_SPLITS_ENABLED`; otherwise Stripe Connect splits only. |

### 5. Related files (no flag, but part of splits/fund-requests flow)

| File | Role |
|------|------|
| `src/app/api/create-payment-intent/route.ts` | POST handler; forwards `fundRequestId`, `donationLinkId`, `embedCardId` to `createPaymentIntentForDonation`. |
| `src/app/give/[slug]/donation-form.tsx` | Accepts `fundRequestId`, `donationLinkId`, `embedCardId`; passes to create-payment-intent API. |
| `src/app/give/[slug]/page.tsx` | Reads `link` query param; resolves `donationLinkId` from `donation_links` table. |
| `src/app/give/[slug]/embed/page.tsx` | Reads `card` param; uses embed card for donation form. |
| `src/app/dashboard/customization/page.tsx` | Fetches `donation_links`, `peer_connections` for splits; passes to `DonateButtonFormSelector`, `EmbedCardsPanel`, `EmbedFormClient`. |
| `src/app/dashboard/embed/embed-cards-panel.tsx` | Fetches `connectedPeers` for split dropdown; `onSave` includes `splits`. |
| `src/app/dashboard/embed/embed-form-client.tsx` | Receives `initialSplits`, `connectedPeers`; `handleSave` includes `splits`. |
| `src/app/api/embed-cards/route.ts` | GET/POST embed cards; POST accepts `splits` in body (no flag check). |
| `src/app/api/donation-links/[id]/route.ts` | GET/PATCH/DELETE single donation link (no flag check). |

### 6. Database tables (Supabase)

All splits and fund-request data lives in Supabase Postgres. Ensure these tables exist and RLS is configured:

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `fund_requests` | Fund requests in chat | `thread_id`, `requesting_org_id`, `amount_cents`, `fulfilled_amount_cents`, `status` |
| `split_proposals` | Org-to-org split proposals | `thread_id`, `proposer_org_id`, `amount_cents`, `split_percentages`, `proposer_accepted_at`, `recipient_accepted_at`, `status` |
| `split_transfers` | Idempotency for split webhook | `stripe_payment_intent_id` |
| `donation_links` | Donation links with splits | `organization_id`, `stripe_product_id`, `name`, `slug`, `splits` (JSON) |
| `form_customizations` | Form-level splits | `splits` (JSON) |
| `org_embed_cards` | Card-level splits | `splits` (JSON) |

**Supabase MCP:** If using the Supabase MCP server, you can inspect these tables with `mcp_supabase_list_tables` and run migrations with `mcp_supabase_apply_migration`. The `split_proposals` table may not be in generated TypeScript types; the code uses `@ts-expect-error` where needed.

---

## Optional: Restore Connections Description

When enabling splits, you may want to restore the split transfer description on the Connections page.

**File:** `src/app/dashboard/connections/connections-client.tsx`

**Current (splits disabled):**
```tsx
<p className="mt-1 text-sm text-dashboard-text-muted">
  Search for organizations, send connection requests, and message once accepted.
</p>
```

**With splits enabled:**
```tsx
<p className="mt-1 text-sm text-dashboard-text-muted">
  Search for organizations, send connection requests, and message once accepted. Split transfers require mutual agreement in chat—both parties must accept before any transfer.
</p>
```

---

## Verification Checklist

After enabling:

1. **Feature flags:** `SPLITS_ENABLED = true`, `FUND_REQUESTS_ENABLED = true` in `src/lib/feature-flags.ts`.
2. **Build:** `pnpm build` succeeds.
3. **Chat:** In org-to-org chat, "Propose split" appears. In org-to-user chat, "Request funds" appears.
4. **Embed cards:** Splits step appears in the card wizard.
5. **Form customization:** Payment splits section is visible.
6. **Donation links:** Full page at `/dashboard/donation-links` (not coming soon).
7. **Donate button:** Donation link options appear in the selector.
8. **APIs:** Create fund request, donate to fund request, create split proposal, accept/reject all return 200.
9. **Payment:** Donation with splits creates PaymentIntent with `metadata.splits`; webhook performs transfers.
10. **Fund request:** Donation to fund request updates `fund_requests.fulfilled_amount_cents`.

---

## AI Prompt (Copy-Paste)

```
Enable the splits and fund requests features in the Give donation platform.

1. In src/lib/feature-flags.ts, set SPLITS_ENABLED = true and FUND_REQUESTS_ENABLED = true.

2. Optionally, in src/app/dashboard/connections/connections-client.tsx, restore the split transfer description: "Split transfers require mutual agreement in chat—both parties must accept before any transfer." (append to the existing header text)

3. Run pnpm build to verify.

4. Reference: docs/ENABLE_SPLITS_AND_FUND_REQUESTS.md for the full file list and behavior.
```

---

## Rollback (Disable Again)

Set both flags back to `false` in `src/lib/feature-flags.ts`. No other file changes needed.
