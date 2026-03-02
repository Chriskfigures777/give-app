/**
 * Lambda@Edge viewer-request handler for Give published sites.
 *
 * Routes incoming requests to the correct S3 folder based on the Host header
 * by looking up a domain-map.json stored in the S3 bucket.
 *
 * Deployed to us-east-1 (required for Lambda@Edge).
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Lambda@Edge cannot use environment variables — these are hardcoded at build time
const BUCKET = "give-published-sites";
const REGION = "us-east-1";

let domainMap: Record<string, string> | null = null;
let mapLoadedAt = 0;
const MAP_TTL_MS = 60_000; // refresh mapping every 60s

const s3 = new S3Client({ region: REGION });

async function loadDomainMap(): Promise<Record<string, string>> {
  if (domainMap && Date.now() - mapLoadedAt < MAP_TTL_MS) {
    return domainMap;
  }

  try {
    const resp = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: "_domains/domain-map.json" })
    );
    const body = await resp.Body?.transformToString("utf-8");
    domainMap = body ? JSON.parse(body) : {};
    mapLoadedAt = Date.now();
  } catch {
    if (!domainMap) domainMap = {};
  }

  return domainMap!;
}

export async function handler(
  event: { Records: Array<{ cf: { request: CloudFrontRequest } }> }
) {
  const request = event.Records[0].cf.request;
  const host = (request.headers.host?.[0]?.value ?? "").toLowerCase();

  const map = await loadDomainMap();
  const orgSlug = map[host];

  if (!orgSlug) {
    return {
      status: "404",
      statusDescription: "Not Found",
      body: "<!DOCTYPE html><html><body><h1>Site not found</h1></body></html>",
      headers: { "content-type": [{ key: "Content-Type", value: "text/html" }] },
    };
  }

  let uri = request.uri || "/";

  // Normalise: strip trailing slash except root
  if (uri.length > 1 && uri.endsWith("/")) {
    uri = uri.slice(0, -1);
  }

  // Map to S3 key: /about → /{orgSlug}/about/index.html, / → /{orgSlug}/index.html
  if (uri === "/" || uri === "") {
    request.uri = `/${orgSlug}/index.html`;
  } else {
    request.uri = `/${orgSlug}${uri}/index.html`;
  }

  return request;
}

type CloudFrontRequest = {
  uri: string;
  headers: Record<string, Array<{ key: string; value: string }>>;
  querystring: string;
  method: string;
};
