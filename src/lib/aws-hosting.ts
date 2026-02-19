/**
 * AWS S3 + CloudFront hosting for published websites.
 *
 * Uses separate env vars (AWS_ROUTE53_*) for credentials since they already
 * have the necessary permissions, plus new vars for bucket and distribution.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetDistributionConfigCommand,
  UpdateDistributionCommand,
} from "@aws-sdk/client-cloudfront";

import {
  ACMClient,
  RequestCertificateCommand,
  DescribeCertificateCommand,
  ListCertificatesCommand,
} from "@aws-sdk/client-acm";

// ---------------------------------------------------------------------------
// Clients (lazy singletons)
// ---------------------------------------------------------------------------

let _s3: S3Client | null = null;
let _cf: CloudFrontClient | null = null;
let _acm: ACMClient | null = null;

function getCredentials() {
  const accessKeyId =
    process.env.AWS_HOSTING_ACCESS_KEY_ID ??
    process.env.AWS_ROUTE53_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.AWS_HOSTING_SECRET_ACCESS_KEY ??
    process.env.AWS_ROUTE53_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  return { accessKeyId, secretAccessKey };
}

const region = () =>
  process.env.AWS_HOSTING_REGION ??
  process.env.AWS_ROUTE53_REGION ??
  "us-east-1";

function getS3(): S3Client | null {
  if (_s3) return _s3;
  const creds = getCredentials();
  if (!creds) return null;
  _s3 = new S3Client({ region: region(), credentials: creds });
  return _s3;
}

function getCF(): CloudFrontClient | null {
  if (_cf) return _cf;
  const creds = getCredentials();
  if (!creds) return null;
  _cf = new CloudFrontClient({ region: region(), credentials: creds });
  return _cf;
}

function getACM(): ACMClient | null {
  if (_acm) return _acm;
  const creds = getCredentials();
  if (!creds) return null;
  // ACM certificates for CloudFront must be in us-east-1
  _acm = new ACMClient({ region: "us-east-1", credentials: creds });
  return _acm;
}

function bucket() {
  return process.env.AWS_HOSTING_BUCKET || "give-published-sites";
}

function distributionId() {
  return process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID || "";
}

export function cloudfrontDomain() {
  return process.env.AWS_CLOUDFRONT_DOMAIN || "";
}

export function isHostingConfigured(): boolean {
  return !!(getS3() && bucket() && distributionId());
}

// ---------------------------------------------------------------------------
// S3 – Upload / Delete site files
// ---------------------------------------------------------------------------

export type SitePage = {
  slug: string; // "" for home, "about", "contact", etc.
  html: string;
};

/**
 * Upload all pages for an org to S3.
 * Structure: `{orgSlug}/index.html`, `{orgSlug}/about/index.html`, etc.
 */
export async function uploadSiteToS3(
  orgSlug: string,
  pages: SitePage[]
): Promise<{ ok: boolean; error?: string }> {
  const s3 = getS3();
  if (!s3) return { ok: false, error: "S3 not configured" };

  try {
    for (const page of pages) {
      const key =
        page.slug === "" || page.slug === "home"
          ? `${orgSlug}/index.html`
          : `${orgSlug}/${page.slug}/index.html`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket(),
          Key: key,
          Body: page.html,
          ContentType: "text/html; charset=utf-8",
          CacheControl: "public, max-age=300, s-maxage=3600",
        })
      );
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("S3 upload error:", msg);
    return { ok: false, error: msg };
  }
}

/** Delete all files for an org from S3 (unpublish). */
export async function deleteSiteFromS3(
  orgSlug: string
): Promise<{ ok: boolean; error?: string }> {
  const s3 = getS3();
  if (!s3) return { ok: false, error: "S3 not configured" };

  try {
    const listed = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: `${orgSlug}/`,
      })
    );

    const keys = (listed.Contents ?? [])
      .map((o) => o.Key)
      .filter(Boolean) as string[];

    if (keys.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket(),
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        })
      );
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("S3 delete error:", msg);
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// S3 – Domain mapping file
// ---------------------------------------------------------------------------

/**
 * Update the `_domains/domain-map.json` file in S3.
 * Lambda@Edge reads this to route custom domains to org folders.
 */
export async function updateDomainMap(
  domainMap: Record<string, string> // domain → orgSlug
): Promise<{ ok: boolean; error?: string }> {
  const s3 = getS3();
  if (!s3) return { ok: false, error: "S3 not configured" };

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: "_domains/domain-map.json",
        Body: JSON.stringify(domainMap, null, 2),
        ContentType: "application/json",
        CacheControl: "public, max-age=60",
      })
    );
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Domain map update error:", msg);
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// CloudFront – Cache invalidation
// ---------------------------------------------------------------------------

/** Invalidate CloudFront cache for an org's site. */
export async function invalidateCloudFrontCache(
  orgSlug: string
): Promise<{ ok: boolean; error?: string }> {
  const cf = getCF();
  const distId = distributionId();
  if (!cf || !distId) return { ok: false, error: "CloudFront not configured" };

  try {
    await cf.send(
      new CreateInvalidationCommand({
        DistributionId: distId,
        InvalidationBatch: {
          CallerReference: `${orgSlug}-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: [`/${orgSlug}/*`],
          },
        },
      })
    );
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("CloudFront invalidation error:", msg);
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// CloudFront – Alternate domain management
// ---------------------------------------------------------------------------

/**
 * Add a custom domain as a CloudFront alternate domain name (CNAME).
 * Requires an ACM certificate ARN that covers the domain.
 */
export async function addCloudFrontDomain(
  domain: string,
  acmCertArn: string
): Promise<{ ok: boolean; error?: string }> {
  const cf = getCF();
  const distId = distributionId();
  if (!cf || !distId) return { ok: false, error: "CloudFront not configured" };

  try {
    const config = await cf.send(
      new GetDistributionConfigCommand({ Id: distId })
    );

    const distConfig = config.DistributionConfig;
    if (!distConfig || !config.ETag) {
      return { ok: false, error: "Could not read distribution config" };
    }

    const aliases = distConfig.Aliases ?? { Quantity: 0, Items: [] };
    const items = aliases.Items ?? [];

    if (items.includes(domain)) {
      return { ok: true }; // already added
    }

    items.push(domain);
    distConfig.Aliases = { Quantity: items.length, Items: items };

    // Use the provided ACM cert
    distConfig.ViewerCertificate = {
      ACMCertificateArn: acmCertArn,
      SSLSupportMethod: "sni-only",
      MinimumProtocolVersion: "TLSv1.2_2021",
    };

    await cf.send(
      new UpdateDistributionCommand({
        Id: distId,
        IfMatch: config.ETag,
        DistributionConfig: distConfig,
      })
    );

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("CloudFront add domain error:", msg);
    return { ok: false, error: msg };
  }
}

/** Remove a custom domain from CloudFront. */
export async function removeCloudFrontDomain(
  domain: string
): Promise<{ ok: boolean; error?: string }> {
  const cf = getCF();
  const distId = distributionId();
  if (!cf || !distId) return { ok: false, error: "CloudFront not configured" };

  try {
    const config = await cf.send(
      new GetDistributionConfigCommand({ Id: distId })
    );

    const distConfig = config.DistributionConfig;
    if (!distConfig || !config.ETag) {
      return { ok: false, error: "Could not read distribution config" };
    }

    const aliases = distConfig.Aliases ?? { Quantity: 0, Items: [] };
    const items = (aliases.Items ?? []).filter((d) => d !== domain);
    distConfig.Aliases = { Quantity: items.length, Items: items };

    await cf.send(
      new UpdateDistributionCommand({
        Id: distId,
        IfMatch: config.ETag,
        DistributionConfig: distConfig,
      })
    );

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("CloudFront remove domain error:", msg);
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// ACM – SSL certificate provisioning
// ---------------------------------------------------------------------------

/** Request an ACM certificate for a domain using DNS validation. */
export async function requestCertificate(
  domain: string
): Promise<{
  ok: boolean;
  certArn?: string;
  validationRecord?: { name: string; value: string };
  error?: string;
}> {
  const acm = getACM();
  if (!acm) return { ok: false, error: "ACM not configured" };

  try {
    // Check if a cert already exists for this domain
    const existing = await acm.send(
      new ListCertificatesCommand({
        CertificateStatuses: ["PENDING_VALIDATION", "ISSUED"],
      })
    );

    const match = (existing.CertificateSummaryList ?? []).find(
      (c) => c.DomainName === domain
    );

    if (match?.CertificateArn) {
      const desc = await acm.send(
        new DescribeCertificateCommand({
          CertificateArn: match.CertificateArn,
        })
      );

      const dvo = desc.Certificate?.DomainValidationOptions?.[0];
      return {
        ok: true,
        certArn: match.CertificateArn,
        validationRecord: dvo?.ResourceRecord
          ? { name: dvo.ResourceRecord.Name ?? "", value: dvo.ResourceRecord.Value ?? "" }
          : undefined,
      };
    }

    // Request new certificate
    const result = await acm.send(
      new RequestCertificateCommand({
        DomainName: domain,
        ValidationMethod: "DNS",
        Tags: [{ Key: "ManagedBy", Value: "give-app" }],
      })
    );

    if (!result.CertificateArn) {
      return { ok: false, error: "Failed to request certificate" };
    }

    // Wait briefly then fetch validation records
    await new Promise((r) => setTimeout(r, 3000));

    const desc = await acm.send(
      new DescribeCertificateCommand({
        CertificateArn: result.CertificateArn,
      })
    );

    const dvo = desc.Certificate?.DomainValidationOptions?.[0];
    return {
      ok: true,
      certArn: result.CertificateArn,
      validationRecord: dvo?.ResourceRecord
        ? { name: dvo.ResourceRecord.Name ?? "", value: dvo.ResourceRecord.Value ?? "" }
        : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("ACM request error:", msg);
    return { ok: false, error: msg };
  }
}

/** Check if an ACM certificate has been validated and issued. */
export async function getCertificateStatus(
  certArn: string
): Promise<{ status: string; error?: string }> {
  const acm = getACM();
  if (!acm) return { status: "UNKNOWN", error: "ACM not configured" };

  try {
    const desc = await acm.send(
      new DescribeCertificateCommand({ CertificateArn: certArn })
    );
    return { status: desc.Certificate?.Status ?? "UNKNOWN" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: "ERROR", error: msg };
  }
}
