-- Add acm_cert_arn column to organization_domains table.
-- This stores the AWS ACM certificate ARN for SSL termination at CloudFront.
-- Uses IF NOT EXISTS so it is safe to run against a database that already has the column.

ALTER TABLE organization_domains
  ADD COLUMN IF NOT EXISTS acm_cert_arn text;

COMMENT ON COLUMN organization_domains.acm_cert_arn IS
  'ARN of the AWS ACM certificate issued for this domain (used with CloudFront HTTPS).';
