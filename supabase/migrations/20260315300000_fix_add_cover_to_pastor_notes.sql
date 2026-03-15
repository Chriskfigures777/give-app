-- Re-apply cover columns (original migration tracked but columns missing)
ALTER TABLE pastor_notes ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE pastor_notes ADD COLUMN IF NOT EXISTS cover_type text;
