-- Website form inquiries + email threading settings
-- - Stores inbound form submissions as structured inquiries
-- - Stores conversation messages (visitor <-> org) routed through Resend inbound webhooks
-- - Adds org-level settings for where to forward form submissions

-- Org settings (used by website form submissions)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_forms_forward_to_email text;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_forms_reply_name text;

-- Inquiries
CREATE TABLE IF NOT EXISTS website_form_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  org_slug text NOT NULL,
  page_slug text,
  form_kind text,
  visitor_name text,
  visitor_email text NOT NULL,
  visitor_phone text,
  subject text NOT NULL,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  thread_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_website_form_inquiries_org_created
  ON website_form_inquiries(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_form_inquiries_thread
  ON website_form_inquiries(thread_token);

-- Messages (conversation items)
CREATE TABLE IF NOT EXISTS website_form_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES website_form_inquiries(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('visitor_to_org','org_to_visitor')),
  from_email text NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  text text,
  html text,
  resend_email_id text,
  resend_received_email_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_website_form_messages_inquiry_created
  ON website_form_messages(inquiry_id, created_at);

CREATE INDEX IF NOT EXISTS idx_website_form_messages_received_id
  ON website_form_messages(resend_received_email_id);

-- RLS
ALTER TABLE website_form_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_form_messages ENABLE ROW LEVEL SECURITY;

-- Org owners/admins can access their inquiries/messages
CREATE POLICY "org_members_access_website_form_inquiries"
  ON website_form_inquiries FOR ALL
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

CREATE POLICY "org_members_access_website_form_messages"
  ON website_form_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM website_form_inquiries i
      WHERE i.id = website_form_messages.inquiry_id
        AND i.organization_id IN (
          SELECT id FROM organizations WHERE owner_user_id = auth.uid()
          UNION
          SELECT organization_id FROM organization_admins WHERE user_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM website_form_inquiries i
      WHERE i.id = website_form_messages.inquiry_id
        AND i.organization_id IN (
          SELECT id FROM organizations WHERE owner_user_id = auth.uid()
          UNION
          SELECT organization_id FROM organization_admins WHERE user_id = auth.uid()
        )
    )
  );

-- Service role bypass (webhooks, public form submits)
CREATE POLICY "service_role_full_access_website_form_inquiries"
  ON website_form_inquiries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_website_form_messages"
  ON website_form_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

