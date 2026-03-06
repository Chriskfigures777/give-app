-- Organization contacts (CRM): one row per (organization_id, email) for donors, form submitters, survey respondents.
-- Used for unified People/Members list, event reminders, and broadcast.

CREATE TABLE IF NOT EXISTS organization_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text,
  name text,
  phone text,
  source text NOT NULL DEFAULT 'donation',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sources_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_contacts_org_email_unique UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_organization_contacts_org_last_seen
  ON organization_contacts (organization_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_organization_contacts_org_created
  ON organization_contacts (organization_id, created_at DESC);

ALTER TABLE organization_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_access_organization_contacts"
  ON organization_contacts FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_user_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_admins WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_user_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_full_access_organization_contacts"
  ON organization_contacts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE organization_contacts IS 'Unified CRM contacts per org: donors, form submitters, survey respondents. Keyed by (org, email).';
