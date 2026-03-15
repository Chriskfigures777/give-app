/**
 * AI credit bundles available for purchase.
 * price_cents is what the org pays.
 * platform_fee_cents is your application fee — you keep this on top of the transaction.
 * credits is how many AI credits are added to the org.
 */
export const CREDIT_BUNDLES = [
  {
    id: "credits_25",
    label: "25 AI Credits",
    credits: 25,
    price_cents: 499,          // $4.99
    platform_fee_cents: 75,    // $0.75 platform fee (~15%)
    description: "25 AI credits — generate survey questions, AI notes, and more.",
  },
  {
    id: "credits_100",
    label: "100 AI Credits",
    credits: 100,
    price_cents: 1499,         // $14.99
    platform_fee_cents: 225,   // $2.25 platform fee (~15%)
    description: "100 AI credits — best value for active organizations.",
  },
  {
    id: "credits_250",
    label: "250 AI Credits",
    credits: 250,
    price_cents: 2999,         // $29.99
    platform_fee_cents: 450,   // $4.50 platform fee (~15%)
    description: "250 AI credits — power user bundle for large congregations.",
  },
] as const;

export type CreditBundleId = (typeof CREDIT_BUNDLES)[number]["id"];
