import { dwollaClient, isDwollaConfigured } from "./client";

export type CreateFundingSourceFromPlaidOptions = {
  processorToken: string;
  customerId: string;
  fundingSourceName: string;
  bankAccountType: "checking" | "savings";
};

/**
 * Get the Plaid exchange partner href from Dwolla.
 */
async function getPlaidExchangePartnerHref(): Promise<string> {
  if (!dwollaClient) throw new Error("Dwolla is not configured");
  const response = await dwollaClient.get("exchange-partners");
  const partners = (response.body as { _embedded?: { "exchange-partners"?: { name: string; _links: { self: { href: string } } }[] } })._embedded?.["exchange-partners"] ?? [];
  const plaid = partners.find((p) => p.name === "Plaid");
  if (!plaid) throw new Error("Plaid exchange partner not found");
  return plaid._links.self.href;
}

/**
 * Create a Dwolla exchange for a customer using a Plaid processor token.
 * Returns the exchange resource URL (from Location header).
 */
async function createExchange(
  customerId: string,
  processorToken: string,
  exchangePartnerHref: string
): Promise<string> {
  if (!dwollaClient) throw new Error("Dwolla is not configured");
  const response = await dwollaClient.post(
    `customers/${customerId}/exchanges`,
    {
      _links: {
        "exchange-partner": { href: exchangePartnerHref },
      },
      token: processorToken,
    }
  );
  const location = response.headers.get("Location");
  if (!location) throw new Error("No Location header in exchange response");
  return location;
}

/**
 * Create a verified funding source for a Dwolla customer using a Plaid processor token.
 * Uses Dwolla's Secure Exchange with Plaid.
 * Returns the funding source URL (from Location header).
 */
export async function createFundingSourceFromPlaid(
  options: CreateFundingSourceFromPlaidOptions
): Promise<string> {
  if (!isDwollaConfigured()) {
    throw new Error("Dwolla is not configured");
  }

  const exchangePartnerHref = await getPlaidExchangePartnerHref();
  const exchangeUrl = await createExchange(
    options.customerId,
    options.processorToken,
    exchangePartnerHref
  );

  const response = await dwollaClient!.post(
    `customers/${options.customerId}/funding-sources`,
    {
      _links: {
        exchange: { href: exchangeUrl },
      },
      bankAccountType: options.bankAccountType,
      name: options.fundingSourceName,
    }
  );

  const location = response.headers.get("Location");
  if (!location) throw new Error("No Location header in funding source response");
  return location;
}

/**
 * Create an unverified Dwolla customer for a split recipient.
 * Used when adding a bank account via Plaid for a split recipient.
 */
export async function createUnverifiedCustomer(params: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<string> {
  if (!dwollaClient) throw new Error("Dwolla is not configured");
  const response = await dwollaClient.post("customers", {
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
  });
  const location = response.headers.get("Location");
  if (!location) throw new Error("No Location header in customer response");
  return location;
}
