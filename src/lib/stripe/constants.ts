/** Detect Stripe test mode from secret key prefix. */
export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_test_");
}

/** 1% platform fee on each payment. */
export const PLATFORM_FEE_PERCENT = 1;

/** 30% of platform fee goes to endowment fund. */
export const ENDOWMENT_SHARE_OF_PLATFORM_FEE = 0.3;

export const CURRENCY = "usd" as const;
