# Phase 3: Donations + Embed (optional next steps)

- **Embed**: `/give/[slug]` already serves the donation form. Add an embeddable iframe URL (e.g. `/give/[slug]/embed`) with minimal chrome for org websites.
- **Recurring**: use Stripe Subscriptions or recurring PaymentIntents for “monthly” option when `donation_campaigns.allow_recurring` is true; store subscription_id in metadata and handle in webhooks.
- **Tax summaries**: donor dashboard page to list donations and a “Download tax summary” (e.g. CSV or PDF) for a given year.
- **Suggested amounts**: already read from `form_customizations.suggested_amounts` or campaign; keep server-driven.
