-- Custom domains for published websites (Phase 2)
CREATE TABLE IF NOT EXISTS organization_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  verified_at timestamptz,
  dns_provider text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(domain)
);

CREATE INDEX IF NOT EXISTS idx_organization_domains_org ON organization_domains(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_domains_domain ON organization_domains(domain);
CREATE INDEX IF NOT EXISTS idx_organization_domains_status ON organization_domains(status) WHERE status = 'verified';

ALTER TABLE organization_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access organization_domains"
  ON organization_domains FOR ALL
  USING (true)
  WITH CHECK (true);
