# AWS Use Cases — Give App

Technical use cases for AWS services in the Give donation platform, broken down by feature.

---

## EventBridge + Lambda (Scheduled Jobs)

### 1. Year-End Tax Receipts (Auto-Send)

**Current:** Donors click "Download PDF" in My Donations. They must remember to do it.

**With EventBridge:**
- **Schedule:** Jan 1, 6:00 AM (or configurable)
- **Lambda:** Query all donors with donations in prior year → generate PDF → email via SES
- **Benefit:** Donors get their tax summary automatically. No one forgets.

---

### 2. Campaign End Reminders

**Use case:** Campaign has `end_date`. Org admin should be reminded.

**With EventBridge:**
- **Schedule:** Daily at 8:00 AM
- **Lambda:** Find campaigns ending in 3 days → send email to org admins
- **Benefit:** "Your campaign ends soon — consider extending or closing."

---

### 3. Fund Request Follow-Up

**Use case:** Org A requests funds from Org B. Org B hasn't responded in 7 days.

**With EventBridge:**
- **Schedule:** Daily
- **Lambda:** Find open fund requests older than 7 days → send reminder to recipient
- **Benefit:** Keeps collaborative fundraising moving.

---

### 4. Daily Donation Digest (Org Admins)

**Use case:** Org wants a daily summary of donations.

**With EventBridge:**
- **Schedule:** Every day at 9:00 AM
- **Lambda:** For each org with donations yesterday → aggregate totals → email digest
- **Benefit:** "You received $X from Y donors yesterday."

---

### 5. Recurring Donation Renewal Reminder

**Use case:** Donor has monthly subscription. Remind them before renewal.

**With EventBridge:**
- **Schedule:** Daily
- **Lambda:** Find subscriptions renewing in 3 days → email donor
- **Benefit:** "Your $50 monthly gift to [Church] renews on [date]."

---

### 6. Stale Campaign Cleanup

**Use case:** Campaigns with no activity for 90+ days.

**With EventBridge:**
- **Schedule:** Weekly (e.g., Sunday 2:00 AM)
- **Lambda:** Find campaigns with no donations in 90 days → mark inactive or notify org
- **Benefit:** Keeps data clean; org can archive or relaunch.

---

### 7. Analytics Pre-Compute (Dashboard Stats)

**Use case:** Dashboard shows donation totals, charts. Querying on every page load can be slow.

**With EventBridge:**
- **Schedule:** Every 15 minutes or hourly
- **Lambda:** Pre-compute org stats (total donations, monthly trends) → store in cache table or Redis
- **Benefit:** Dashboard loads faster; no heavy queries on read.

---

### 8. Subscription Failure Retry

**Use case:** Stripe subscription payment failed. Stripe retries, but you want to notify the donor.

**With EventBridge:**
- **Schedule:** Daily
- **Lambda:** Query Stripe for subscriptions with `past_due` → email donor to update payment method
- **Benefit:** Reduces churn; donor fixes card before cancellation.

---

## S3 (Storage)

### 9. Receipt PDF Storage

**Use case:** Year-end PDFs and per-donation receipts. Today they're generated on-demand.

**With S3:**
- Store generated PDFs in S3
- Signed URLs for download (no need to regenerate)
- **Benefit:** Faster downloads; can resend link if donor loses it.

---

### 10. Org Page Media Backup

**Use case:** Org uploads hero images, team photos to Supabase Storage. Redundancy.

**With S3:**
- **EventBridge:** Nightly sync Supabase Storage → S3
- **Benefit:** Backup if Supabase has an issue.

---

### 11. Export / Report Files

**Use case:** Org wants to export donation history as CSV for their accountant.

**With S3:**
- Lambda generates CSV → uploads to S3 → returns signed download link
- **Benefit:** Large exports don't time out; user gets link to download.

---

## SES (Email)

### 12. Transactional Email

**Use case:** Receipts, donation confirmations, password reset. Today you might use Resend, SendGrid, etc.

**With SES:**
- Lambda or Next.js API sends via SES
- **Benefit:** Lower cost at scale; full control; no third-party dependency.

---

### 13. Batch Email (Newsletters, Announcements)

**Use case:** Platform announcement to all org admins. "New feature: X."

**With SES:**
- Lambda fetches org admin emails → sends via SES (with batching)
- **Benefit:** No need for Mailchimp for internal announcements.

---

## Summary by Priority

| Priority | Use Case | Service | Effort |
| -------- | -------- | ------- | ------ |
| High | Year-end auto-send receipts | EventBridge + Lambda + SES | Medium |
| High | Daily donation digest | EventBridge + Lambda | Medium |
| Medium | Campaign end reminders | EventBridge + Lambda | Low |
| Medium | Receipt PDF storage in S3 | S3 + Lambda | Low |
| Medium | Recurring renewal reminder | EventBridge + Lambda | Medium |
| Low | Stale campaign cleanup | EventBridge + Lambda | Low |
| Low | Analytics pre-compute | EventBridge + Lambda | High |

---

## What You Have Today (No AWS)

- Year-end PDF: User clicks Download → API generates on-demand
- Donation notifications: Real-time via Supabase Realtime (no email)
- Campaigns: Manual; no automated reminders
- Receipts: Per-donation page; no batch email

Adding EventBridge + Lambda moves the heavy, scheduled work off your Next.js app so it stays fast and reliable.
