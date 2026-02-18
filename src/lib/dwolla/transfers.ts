import { randomUUID } from "crypto";
import { dwollaClient, isDwollaConfigured } from "./client";

export type CreateTransferOptions = {
  sourceFundingSourceUrl: string;
  destinationFundingSourceUrl: string;
  amountCents: number;
  idempotencyKey?: string;
};

/**
 * Create an ACH transfer from a source funding source to a destination funding source.
 * Returns the transfer URL (from Location header).
 */
export async function createTransfer(
  options: CreateTransferOptions
): Promise<string> {
  if (!isDwollaConfigured()) {
    throw new Error("Dwolla is not configured");
  }

  const amountValue = (options.amountCents / 100).toFixed(2);

  const body = {
    _links: {
      source: { href: options.sourceFundingSourceUrl },
      destination: { href: options.destinationFundingSourceUrl },
    },
    amount: {
      currency: "USD",
      value: amountValue,
    },
  };

  const headers: Record<string, string> = {};
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const response = await dwollaClient!.post("transfers", body, headers);
  const location = response.headers.get("Location");
  if (!location) throw new Error("No Location header in transfer response");
  return location;
}

/**
 * Generate an idempotency key for Dwolla transfers.
 */
export function generateTransferIdempotencyKey(
  paymentIntentId: string,
  splitBankAccountId: string
): string {
  return `${paymentIntentId}-${splitBankAccountId}`;
}
