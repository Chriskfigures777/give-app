-- Add created_by to track which user created each website builder project
ALTER TABLE website_builder_projects
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill created_by from the organization owner for existing rows
UPDATE website_builder_projects wbp
SET created_by = o.owner_user_id
FROM organizations o
WHERE wbp.organization_id = o.id
  AND wbp.created_by IS NULL;

-- Index for user-level lookups
CREATE INDEX IF NOT EXISTS idx_website_builder_projects_created_by
  ON website_builder_projects(created_by);

-- Ensure org_id index exists for fast filtering
CREATE INDEX IF NOT EXISTS idx_website_builder_projects_org
  ON website_builder_projects(organization_id);

-- Enable Row Level Security
ALTER TABLE website_builder_projects ENABLE ROW LEVEL SECURITY;

-- Allow access for org owners and admins (matches API-level auth checks)
CREATE POLICY "org_members_access_website_builder_projects"
  ON website_builder_projects FOR ALL
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

-- Service role bypass for server-side operations (webhooks, republish, etc.)
CREATE POLICY "service_role_full_access_website_builder_projects"
  ON website_builder_projects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
