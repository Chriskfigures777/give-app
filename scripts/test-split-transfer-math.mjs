#!/usr/bin/env node
/**
 * Unit test for split transfer math.
 * Verifies netAmount = charge - Stripe fee - platform fee (prevents negative platform balance).
 *
 * Run: node scripts/test-split-transfer-math.mjs
 */

const STRIPE_FEE_RATE = 0.029;
const STRIPE_FEE_FIXED_CENTS = 30;
const PLATFORM_FEE_RATE = 0.01;

function calculateStripeFeeCents(chargeCents) {
  return Math.ceil(chargeCents * STRIPE_FEE_RATE) + STRIPE_FEE_FIXED_CENTS;
}

function testSplitMath(chargeCents, platformFeeCents, formOwnerPct, peerPct) {
  const stripeFeeCents = calculateStripeFeeCents(chargeCents);
  const netAmount = Math.max(0, chargeCents - stripeFeeCents - platformFeeCents);
  const formOwnerAmt = Math.round((formOwnerPct / 100) * netAmount);
  const peerAmt = Math.round((peerPct / 100) * netAmount);
  const totalTransferred = formOwnerAmt + peerAmt;
  const platformAvailable = chargeCents - stripeFeeCents;

  return {
    chargeCents,
    stripeFeeCents,
    platformFeeCents,
    netAmount,
    formOwnerAmt,
    peerAmt,
    totalTransferred,
    platformAvailable,
    ok: totalTransferred <= platformAvailable,
  };
}

console.log("\n=== Split Transfer Math Test ===\n");

// $100,000 donation, 1% platform fee, 50/50 split
const r1 = testSplitMath(10_000_000, 100_000, 50, 50);
console.log("$100,000 charge, 50/50 split:");
console.log("  Charge:           $", (r1.chargeCents / 100).toFixed(2));
console.log("  Stripe fee:       $", (r1.stripeFeeCents / 100).toFixed(2));
console.log("  Platform fee:    $", (r1.platformFeeCents / 100).toFixed(2));
console.log("  Net to split:    $", (r1.netAmount / 100).toFixed(2));
console.log("  Form owner (50%): $", (r1.formOwnerAmt / 100).toFixed(2));
console.log("  Peer (50%):       $", (r1.peerAmt / 100).toFixed(2));
console.log("  Total transferred:", (r1.totalTransferred / 100).toFixed(2));
console.log("  Platform has:     $", (r1.platformAvailable / 100).toFixed(2));
console.log("  OK (transfer <= available):", r1.ok ? "PASS" : "FAIL");

// $100 donation
const r2 = testSplitMath(10_000, 100, 50, 50);
console.log("\n$100 charge, 50/50 split:");
console.log("  Net to split:    $", (r2.netAmount / 100).toFixed(2));
console.log("  Form owner:      $", (r2.formOwnerAmt / 100).toFixed(2));
console.log("  Peer:            $", (r2.peerAmt / 100).toFixed(2));
console.log("  OK:", r2.ok ? "PASS" : "FAIL");

// OLD (buggy) math for comparison
const oldNet100k = 10_000_000 - 100_000; // $99,000 - would overdraw
const oldPlatformAvailable = 10_000_000 - 290030; // ~$97,099.70
console.log("\n--- OLD (buggy) math for $100k ---");
console.log("  Old netAmount:    $", (oldNet100k / 100).toFixed(2), "(would try to transfer)");
console.log("  Platform has:     $", (oldPlatformAvailable / 100).toFixed(2));
console.log("  Overdraw:         $", ((oldNet100k - oldPlatformAvailable) / 100).toFixed(2));

const allPass = r1.ok && r2.ok;
console.log("\n" + (allPass ? "All tests PASSED." : "Some tests FAILED."));
process.exit(allPass ? 0 : 1);
