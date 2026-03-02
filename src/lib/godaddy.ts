/**
 * GoDaddy Production API client for DNS management.
 * Only works for domains in the account that owns the API keys.
 * For customer domains, use manual DNS instructions.
 */

const GODADDY_API = "https://api.godaddy.com";

export type GodaddyRecord = {
  data: string;
  name: string;
  ttl: number;
  type: string;
};

export async function getGodaddyRecords(
  domain: string,
  type: string,
  name: string
): Promise<GodaddyRecord[]> {
  const key = process.env.GODADDY_API_KEY;
  const secret = process.env.GODADDY_API_SECRET;
  if (!key || !secret) return [];

  const res = await fetch(
    `${GODADDY_API}/v1/domains/${domain}/records/${type}/${encodeURIComponent(name)}`,
    {
      headers: {
        Authorization: `sso-key ${key}:${secret}`,
      },
    }
  );
  if (!res.ok) return [];
  return res.json();
}

/** Add or replace CNAME record. Domain = apex (e.g. gracechurch.org), name = host (e.g. www) */
export async function addGodaddyCname(
  domain: string,
  name: string,
  data: string,
  ttl = 600
): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.GODADDY_API_KEY;
  const secret = process.env.GODADDY_API_SECRET;
  if (!key || !secret) {
    return { ok: false, error: "GoDaddy API not configured" };
  }

  const records = [{ data, ttl }];
  const res = await fetch(
    `${GODADDY_API}/v1/domains/${domain}/records/CNAME/${encodeURIComponent(name)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `sso-key ${key}:${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(records),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: res.status === 403 ? "Domain not in your GoDaddy account" : text || `HTTP ${res.status}` };
  }
  return { ok: true };
}
