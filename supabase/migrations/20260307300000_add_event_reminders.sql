-- Event reminder toggles on events; sent reminders log to avoid duplicates.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS remind_1_week boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS remind_1_day boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS event_reminder_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES organization_contacts(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('1_week', '1_day')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, contact_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_event_reminder_sends_event
  ON event_reminder_sends (event_id);

ALTER TABLE event_reminder_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_event_reminder_sends"
  ON event_reminder_sends FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE event_reminder_sends IS 'Tracks sent event reminders (1 week / 1 day before) per contact for idempotency.';
