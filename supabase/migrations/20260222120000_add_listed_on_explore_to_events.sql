-- Add listed_on_explore to events. Default true so existing events appear on explore page.
ALTER TABLE events
ADD COLUMN IF NOT EXISTS listed_on_explore boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN events.listed_on_explore IS 'When true, event appears on the public Explore page. Users can toggle this in event settings.';
