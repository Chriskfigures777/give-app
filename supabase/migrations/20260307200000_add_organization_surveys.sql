-- Org-level surveys: title, description, questions (JSON), cover image, theme, status. 3-4 questions per page.
CREATE TABLE IF NOT EXISTS organization_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_image_url text,
  theme jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_surveys_org_updated
  ON organization_surveys (organization_id, updated_at DESC);

ALTER TABLE organization_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_access_organization_surveys"
  ON organization_surveys FOR ALL
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

CREATE POLICY "service_role_full_access_organization_surveys"
  ON organization_surveys FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Survey responses: respondent email/name, answers JSON, optional contact_id.
CREATE TABLE IF NOT EXISTS organization_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES organization_surveys(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  respondent_email text,
  respondent_name text,
  contact_id uuid REFERENCES organization_contacts(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_survey_responses_survey
  ON organization_survey_responses (survey_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_organization_survey_responses_contact
  ON organization_survey_responses (contact_id) WHERE contact_id IS NOT NULL;

ALTER TABLE organization_survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_access_organization_survey_responses"
  ON organization_survey_responses FOR ALL
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

CREATE POLICY "service_role_full_access_organization_survey_responses"
  ON organization_survey_responses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE organization_surveys IS 'Org-level surveys; questions stored as JSON with optional page assignment (3-4 per page).';
COMMENT ON TABLE organization_survey_responses IS 'Survey responses; linked to contact when email provided.';
