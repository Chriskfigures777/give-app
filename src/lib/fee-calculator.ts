/**
 * Fee calculation for donations.
 * Stripe charges 2.9% + 30¢ per transaction. Platform fee is 1%.
 *
 * When donor covers fees, we add to the charge so the org receives the full donation.
 * Stripe only charges once - we create ONE PaymentIntent with the total amount.
 */

export const STRIPE_FEE_RATE = 0.029; // 2.9%
export const STRIPE_FEE_FIXED_CENTS = 30; // $0.30
export const PLATFORM_FEE_RATE = 0.01; // 1%

export type FeeCoverage = "org_pays" | "donor_stripe" | "donor_platform" | "donor_both";

/**
 * Calculate the total amount to charge (cents) based on donation amount and fee coverage.
 * Org receives donationCents when donor covers; otherwise org gets less (Stripe + platform deducted).
 */
export function calculateChargeAmountCents(
  donationCents: number,
  feeCoverage: FeeCoverage
): number {
  switch (feeCoverage) {
    case "org_pays":
      return donationCents;
    case "donor_platform":
      // Add 1% so platform fee is covered; org still absorbs Stripe fee
      return Math.ceil(donationCents * (1 + PLATFORM_FEE_RATE));
    case "donor_stripe":
      // Add enough so org receives full donation (Stripe fee covered; platform still from org)
      // charge - (charge * 0.029 + 30) = donation
      // charge * 0.971 = donation + 30
      return Math.ceil((donationCents + STRIPE_FEE_FIXED_CENTS) / (1 - STRIPE_FEE_RATE));
    case "donor_both":
      // Org gets full donation; platform gets 1%. So net needed = donation * 1.01
      // charge - (charge * 0.029 + 30) = donation * 1.01
      return Math.ceil((donationCents * (1 + PLATFORM_FEE_RATE) + STRIPE_FEE_FIXED_CENTS) / (1 - STRIPE_FEE_RATE));
    default:
      return donationCents;
  }
}

/**
 * Estimate the fee amount the donor would pay (in cents) for display.
 */
export function estimateDonorFeeCents(
  donationCents: number,
  feeCoverage: FeeCoverage
): number {
  if (feeCoverage === "org_pays") return 0;
  const totalCents = calculateChargeAmountCents(donationCents, feeCoverage);
  return totalCents - donationCents;
}

/**
 * Human-readable fee description for UI.
 */
export function getFeeCoverageLabel(feeCoverage: FeeCoverage): string {
  switch (feeCoverage) {
    case "org_pays":
      return "Organization pays";
    case "donor_platform":
      return "I'll cover the 1% platform fee";
    case "donor_stripe":
      return "I'll cover processing (2.9% + 30¢)";
    case "donor_both":
      return "I'll cover all fees (2.9% + 30¢ + 1%)";
    default:
      return "Organization pays";
  }
}
