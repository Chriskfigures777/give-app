-- Add cover image/video support to pastor_notes
ALTER TABLE pastor_notes ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE pastor_notes ADD COLUMN IF NOT EXISTS cover_type text CHECK (cover_type IN ('image', 'video'));

COMMENT ON COLUMN pastor_notes.cover_url IS 'Optional Pexels image or video URL for the note cover/header';
COMMENT ON COLUMN pastor_notes.cover_type IS 'Type of cover media: image or video';
