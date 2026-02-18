# Receipt Design and Test vs Live Mode

This document covers two features: (1) the dynamic receipt with Pexels video, and (2) test mode vs live mode separation for Stripe.

---

## Part 1: Dynamic Receipt with Pexels Video

### Overview

Replace the plain HTML receipt with a rich, card-style receipt that matches the embed donation cards. Uses a Pexels donation-themed video when viewing in the browser. PDF download is a plain document (no video) for tax records.

### Current State

- Receipts are served at `/api/receipts/[id]` as plain HTML
- My Donations links open the receipt in a new tab
- No video, no PDF download option

### Target Design

**HTML view (in browser):**

```
┌─────────────────────────────────────────────────┐
│  [Pexels donation video - full width, muted]    │
│  Gradient overlay (black/70 bottom)              │
│  "Thank you for your donation"                  │
│  Optional subtitle                              │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  Organization: [name]                            │
│  Fund: [campaign]                               │
│  Date: [date]                                   │
│  Amount: $X.XX USD                              │
│  Receipt ID: [id]                               │
│  [Download PDF] button                          │
│  Tax disclaimer text                            │
└─────────────────────────────────────────────────┘
```

**PDF download:** Plain document with org, fund, date, amount, receipt ID, disclaimer. No video.

### Video Source (Pexels)

You have Pexels API wired (`PEXELS_API_KEY`, `/api/pexels/search/videos`).

**Option A – Dynamic (recommended):**

- Server-side: call Pexels `/videos/search?query=donation` (or `giving`, `charity`, `helping hands`)
- Use first result’s direct MP4 URL from `video_files` (same logic as existing videos route)
- Cache result (e.g. 1 hour) to limit API calls

**Option B – Curated fallback:**

- Add `RECEIPT_VIDEO_URLS` in `src/lib/stock-media.ts` with 2–3 Pexels donation video MP4 URLs
- Pick one randomly or round-robin
- Fallback to static image if video fails

### Implementation

| File | Change |
|------|--------|
| `src/app/receipts/[id]/page.tsx` | New page: video hero + receipt block + "Download PDF" button |
| `src/app/api/receipts/[id]/route.ts` | Add `?format=pdf` → return PDF; otherwise return HTML with video |
| `src/lib/stock-media.ts` | Add `RECEIPT_VIDEO_URLS` or `getReceiptVideoUrl()` helper |
| `src/app/api/receipts/video/route.ts` | Optional: server route to fetch Pexels donation video URL (cached) |
| `src/app/dashboard/my-donations/page.tsx` | Update receipt link from `/api/receipts/[id]` to `/receipts/[id]` |

### PDF Generation

- Use `@react-pdf/renderer` or `jspdf` + `html2canvas` (client) or `pdf-lib` (server)
- PDF content: org, fund, date, amount, receipt ID, disclaimer only

---

## Part 2: Test Mode vs Live Mode

### Overview

Stripe has two modes: **test** (development) and **live** (production). Keys differ:

- **Test:** `pk_test_...`, `sk_test_...`, `whsec_...` (test webhook secret)
- **Live:** `pk_live_...`, `sk_live_...`, `whsec_...` (live webhook secret)

The app should clearly indicate which mode is active so users don’t accidentally process real payments during testing.

### Env Variables

| Env | Test Mode | Live Mode |
|-----|-----------|-----------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Test webhook secret | Live webhook secret |

Use separate `.env.local` (or Vercel env) for each environment. Do not mix test and live keys.

### Detection

Stripe secret keys:

- Test: `sk_test_` prefix
- Live: `sk_live_` prefix

```ts
export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_test_");
}
```

### UI Indicators

**Dashboard:**

- Show a banner when in test mode: e.g. "You're in Stripe test mode. No real payments will be processed."
- Use a distinct color (e.g. amber/orange) so it’s obvious

**Org/admin flows:**

- On donation form or payment pages, optionally show a short note: "Test mode – use card 4242 4242 4242 4242"

### Implementation

| File | Change |
|------|--------|
| `src/env.ts` or `src/lib/stripe/constants.ts` | Add `isStripeTestMode()` helper |
| `src/app/dashboard/layout.tsx` or `dashboard-welcome-banner.tsx` | Add test-mode banner when `isStripeTestMode()` is true |
| `.env.example` | Add comments: "Use sk_test_/pk_test_ for test, sk_live_/pk_live_ for production" |

### Deployment

- **Local / Vercel Preview:** Use test keys
- **Production (Vercel):** Use live keys in Production env vars only
- Configure separate webhook endpoints in Stripe Dashboard for test and live (e.g. `whsec_...` for each)

### Summary

| Mode | When to Use | Keys |
|------|-------------|------|
| **Test** | Local dev, staging, preview deploys | `sk_test_`, `pk_test_` |
| **Live** | Production only | `sk_live_`, `pk_live_` |
