-- Add respondent_category to organization_surveys: when someone fills the survey on the public page,
-- they are added to People; this controls how they appear (member vs contact).
-- null = just "survey" in sources_breakdown; 'member' or 'contact' = also increment that key.
ALTER TABLE organization_surveys
  ADD COLUMN IF NOT EXISTS respondent_category text CHECK (respondent_category IS NULL OR respondent_category IN ('member', 'contact'));

COMMENT ON COLUMN organization_surveys.respondent_category IS 'When a respondent submits this survey on the public page, add them to People with this category (member/contact); null = survey only.';
