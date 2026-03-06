-- Ministry / pastor notes: title + content (long text). Used for sermon notes and AI-generated survey questions.
CREATE TABLE IF NOT EXISTS pastor_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pastor_notes_org_updated
  ON pastor_notes (organization_id, updated_at DESC);

ALTER TABLE pastor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_access_pastor_notes"
  ON pastor_notes FOR ALL
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

CREATE POLICY "service_role_full_access_pastor_notes"
  ON pastor_notes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- AI usage log for credits/cap (e.g. generate_survey_questions per org per month).
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feature text NOT NULL,
  units int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_org_feature_created
  ON ai_usage_log (organization_id, feature, created_at DESC);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_ai_usage_log"
  ON ai_usage_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE pastor_notes IS 'Ministry/sermon notes per org. Source for AI-generated survey questions.';
COMMENT ON TABLE ai_usage_log IS 'Tracks AI feature usage per org for credits/cap (e.g. generate_survey_questions).';
