/**
 * Feature flags for phased rollout.
 * Splits use Stripe Connect only — no Plaid/Dwolla.
 */

/** Payment splits (embed cards, donation links, form customization). Stripe Connect only. */
export const SPLITS_ENABLED = true;

/** Fund requests in chat (org requests funds, donors fulfill in-thread). */
export const FUND_REQUESTS_ENABLED = false;
