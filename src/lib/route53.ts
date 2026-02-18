/**
 * AWS Route 53 client for DNS management.
 * Replaces the GoDaddy integration for managing hosted zones and DNS records.
 *
 * Uses separate env vars (AWS_ROUTE53_*) so Lambda deploy credentials
 * are not affected.
 */

import {
  Route53Client,
  ListHostedZonesByNameCommand,
  ListHostedZonesCommand,
  CreateHostedZoneCommand,
  ListResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommand,
  GetHostedZoneCommand,
  type HostedZone,
  type ResourceRecordSet,
  type ChangeAction,
  type RRType,
} from "@aws-sdk/client-route-53";

import {
  Route53DomainsClient,
  CheckDomainAvailabilityCommand,
  ListPricesCommand,
} from "@aws-sdk/client-route-53-domains";

// ---------------------------------------------------------------------------
// Clients (lazy-initialised singletons)
// ---------------------------------------------------------------------------

let _r53: Route53Client | null = null;
let _r53d: Route53DomainsClient | null = null;

function getCredentials() {
  const accessKeyId = process.env.AWS_ROUTE53_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_ROUTE53_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  return { accessKeyId, secretAccessKey };
}

function getRoute53Client(): Route53Client | null {
  if (_r53) return _r53;
  const credentials = getCredentials();
  if (!credentials) return null;
  _r53 = new Route53Client({
    region: process.env.AWS_ROUTE53_REGION || "us-east-1",
    credentials,
  });
  return _r53;
}

function getDomainsClient(): Route53DomainsClient | null {
  if (_r53d) return _r53d;
  const credentials = getCredentials();
  if (!credentials) return null;
  // Route 53 Domains API is only available in us-east-1
  _r53d = new Route53DomainsClient({
    region: "us-east-1",
    credentials,
  });
  return _r53d;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DnsRecord = {
  name: string;
  type: string;
  ttl: number;
  values: string[];
};

export type HostedZoneInfo = {
  id: string;
  name: string;
  recordCount: number;
};

export type DomainAvailabilityResult = {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
};

// ---------------------------------------------------------------------------
// Hosted Zones
// ---------------------------------------------------------------------------

/** List all hosted zones in the account */
export async function listHostedZones(): Promise<HostedZoneInfo[]> {
  const client = getRoute53Client();
  if (!client) return [];

  const result = await client.send(new ListHostedZonesCommand({}));
  return (result.HostedZones ?? []).map(zoneToInfo);
}

/** Find the hosted zone for a given domain (e.g. "example.org") */
export async function getHostedZoneForDomain(
  domain: string
): Promise<HostedZoneInfo | null> {
  const client = getRoute53Client();
  if (!client) return null;

  // Normalise: Route 53 stores zone names with trailing dot
  const zoneName = domain.endsWith(".") ? domain : `${domain}.`;

  const result = await client.send(
    new ListHostedZonesByNameCommand({ DNSName: zoneName, MaxItems: 5 })
  );

  const match = (result.HostedZones ?? []).find(
    (z) => z.Name === zoneName && !z.Config?.PrivateZone
  );
  return match ? zoneToInfo(match) : null;
}

/** Create a public hosted zone. Returns the zone info + NS records to delegate. */
export async function createHostedZone(
  domain: string
): Promise<{ zone: HostedZoneInfo; nameservers: string[] } | null> {
  const client = getRoute53Client();
  if (!client) return null;

  const result = await client.send(
    new CreateHostedZoneCommand({
      Name: domain,
      CallerReference: `give-${Date.now()}`,
      HostedZoneConfig: {
        Comment: `Managed by Give app – ${domain}`,
        PrivateZone: false,
      },
    })
  );

  if (!result.HostedZone) return null;

  const ns = result.DelegationSet?.NameServers ?? [];
  return { zone: zoneToInfo(result.HostedZone), nameservers: ns };
}

/** Get zone details including nameservers */
export async function getHostedZoneDetails(
  hostedZoneId: string
): Promise<{ zone: HostedZoneInfo; nameservers: string[] } | null> {
  const client = getRoute53Client();
  if (!client) return null;

  const result = await client.send(
    new GetHostedZoneCommand({ Id: hostedZoneId })
  );

  if (!result.HostedZone) return null;
  const ns = result.DelegationSet?.NameServers ?? [];
  return { zone: zoneToInfo(result.HostedZone), nameservers: ns };
}

// ---------------------------------------------------------------------------
// DNS Records – CRUD
// ---------------------------------------------------------------------------

/** List all DNS records in a hosted zone */
export async function listDnsRecords(
  hostedZoneId: string
): Promise<DnsRecord[]> {
  const client = getRoute53Client();
  if (!client) return [];

  const result = await client.send(
    new ListResourceRecordSetsCommand({ HostedZoneId: hostedZoneId })
  );

  return (result.ResourceRecordSets ?? []).map(rrsToRecord);
}

/** Upsert (create or update) a DNS record */
export async function upsertDnsRecord(
  hostedZoneId: string,
  name: string,
  type: string,
  values: string[],
  ttl = 300
): Promise<{ ok: boolean; error?: string }> {
  return changeDnsRecord(hostedZoneId, "UPSERT", name, type, values, ttl);
}

/** Delete a DNS record */
export async function deleteDnsRecord(
  hostedZoneId: string,
  name: string,
  type: string,
  values: string[],
  ttl = 300
): Promise<{ ok: boolean; error?: string }> {
  return changeDnsRecord(hostedZoneId, "DELETE", name, type, values, ttl);
}

async function changeDnsRecord(
  hostedZoneId: string,
  action: ChangeAction,
  name: string,
  type: string,
  values: string[],
  ttl: number
): Promise<{ ok: boolean; error?: string }> {
  const client = getRoute53Client();
  if (!client) return { ok: false, error: "Route 53 not configured" };

  try {
    await client.send(
      new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Comment: `Give app – ${action} ${type} ${name}`,
          Changes: [
            {
              Action: action,
              ResourceRecordSet: {
                Name: name,
                Type: type as RRType,
                TTL: ttl,
                ResourceRecords: values.map((v) => ({ Value: v })),
              },
            },
          ],
        },
      })
    );
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Route 53 ${action} error:`, msg);
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Convenience: Add / replace CNAME
// Mirrors the old GoDaddy addGodaddyCname signature
// ---------------------------------------------------------------------------

/**
 * Add or replace a CNAME record.
 * Automatically finds (or creates) the hosted zone for the apex domain.
 *
 * @param domain  Apex domain, e.g. "gracechurch.org"
 * @param name    Record host, e.g. "www"
 * @param data    CNAME target value, e.g. "cname.vercel-dns.com"
 * @param ttl     TTL in seconds (default 300)
 */
export async function addRoute53Cname(
  domain: string,
  name: string,
  data: string,
  ttl = 300
): Promise<{ ok: boolean; error?: string }> {
  const client = getRoute53Client();
  if (!client) return { ok: false, error: "Route 53 not configured" };

  // Find or create hosted zone
  let zone = await getHostedZoneForDomain(domain);
  if (!zone) {
    const created = await createHostedZone(domain);
    if (!created) return { ok: false, error: "Could not create hosted zone" };
    zone = created.zone;
  }

  const fqdn = name === "@" || name === ""
    ? `${domain}.`
    : `${name}.${domain}.`;

  return upsertDnsRecord(zone.id, fqdn, "CNAME", [data], ttl);
}

// ---------------------------------------------------------------------------
// Domain Availability (via Route 53 Domains)
// ---------------------------------------------------------------------------

const AVAILABILITY_MAP: Record<string, boolean> = {
  AVAILABLE: true,
  AVAILABLE_RESERVED: true,
  AVAILABLE_PREORDER: true,
};

/** Check if a single domain is available for registration */
export async function checkDomainAvailability(
  domain: string
): Promise<DomainAvailabilityResult> {
  const client = getDomainsClient();
  if (!client) return { domain, available: false };

  try {
    const result = await client.send(
      new CheckDomainAvailabilityCommand({ DomainName: domain })
    );
    const avail = result.Availability
      ? !!AVAILABILITY_MAP[result.Availability]
      : false;
    return { domain, available: avail };
  } catch (err) {
    console.error("Route 53 domain availability error:", err);
    return { domain, available: false };
  }
}

/** Check availability for multiple domains in parallel */
export async function checkDomainsAvailability(
  domains: string[]
): Promise<DomainAvailabilityResult[]> {
  const results = await Promise.allSettled(
    domains.map((d) => checkDomainAvailability(d))
  );
  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { domain: domains[i], available: false }
  );
}

/** Get domain registration pricing for common TLDs */
export async function getDomainPrices(): Promise<
  Map<string, { registration: number; currency: string }>
> {
  const client = getDomainsClient();
  const prices = new Map<string, { registration: number; currency: string }>();
  if (!client) return prices;

  try {
    const result = await client.send(
      new ListPricesCommand({ MaxItems: 50 })
    );
    for (const p of result.Prices ?? []) {
      if (p.Name && p.RegistrationPrice?.Price !== undefined) {
        prices.set(`.${p.Name}`, {
          registration: p.RegistrationPrice.Price,
          currency: p.RegistrationPrice.Currency ?? "USD",
        });
      }
    }
  } catch (err) {
    console.error("Route 53 list prices error:", err);
  }
  return prices;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function zoneToInfo(z: HostedZone): HostedZoneInfo {
  return {
    id: (z.Id ?? "").replace("/hostedzone/", ""),
    name: (z.Name ?? "").replace(/\.$/, ""),
    recordCount: z.ResourceRecordSetCount ?? 0,
  };
}

function rrsToRecord(rrs: ResourceRecordSet): DnsRecord {
  return {
    name: (rrs.Name ?? "").replace(/\.$/, ""),
    type: rrs.Type ?? "UNKNOWN",
    ttl: rrs.TTL ?? 0,
    values: (rrs.ResourceRecords ?? []).map((r) => r.Value ?? ""),
  };
}
