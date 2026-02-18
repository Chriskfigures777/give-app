import { Client } from "dwolla-v2";

const env = process.env.DWOLLA_ENV ?? "sandbox";
const key = process.env.DWOLLA_KEY ?? process.env.DWOLLA_APP_KEY;
const secret = process.env.DWOLLA_SECRET ?? process.env.DWOLLA_APP_SECRET;

if (!key || !secret) {
  console.warn(
    "[dwolla] DWOLLA_KEY and DWOLLA_SECRET (or DWOLLA_APP_KEY/DWOLLA_APP_SECRET) must be set for Dwolla integration"
  );
}

export const dwollaClient =
  key && secret
    ? new Client({
        environment: env as "sandbox" | "production",
        key,
        secret,
      })
    : null;

export function isDwollaConfigured(): boolean {
  return !!dwollaClient;
}
