-- Optional: contacts can opt out of broadcast emails.
ALTER TABLE organization_contacts
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

-- Log of broadcast sends per org (audit).
CREATE TABLE IF NOT EXISTS broadcast_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject text NOT NULL,
  recipient_count int NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_log_org_sent
  ON broadcast_log (organization_id, sent_at DESC);

ALTER TABLE broadcast_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_access_broadcast_log"
  ON broadcast_log FOR ALL
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

COMMENT ON COLUMN organization_contacts.unsubscribed_at IS 'When set, contact has opted out of broadcast emails.';
COMMENT ON TABLE broadcast_log IS 'Audit log of broadcast emails sent to members.';
