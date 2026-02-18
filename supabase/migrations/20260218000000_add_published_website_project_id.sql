-- Add published_website_project_id to organizations for website builder publish
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS published_website_project_id uuid REFERENCES website_builder_projects(id) ON DELETE SET NULL;
