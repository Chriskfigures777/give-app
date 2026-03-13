-- Add year and month columns to budget_sheets for year-based organization.
-- year:  e.g. 2026, 2027 — the fiscal/calendar year this sheet belongs to
-- month: 1–12 for monthly sheets, NULL for an annual summary sheet

ALTER TABLE budget_sheets ADD COLUMN IF NOT EXISTS year  integer;
ALTER TABLE budget_sheets ADD COLUMN IF NOT EXISTS month integer
  CHECK (month IS NULL OR (month BETWEEN 1 AND 12));

-- Back-fill existing rows: try to parse year out of the name field (e.g. "March 2026")
UPDATE budget_sheets
SET year = (regexp_match(name, '\b(20\d{2})\b'))[1]::integer
WHERE year IS NULL
  AND name ~ '\b20\d{2}\b';

-- Index for fast year/type queries
CREATE INDEX IF NOT EXISTS idx_budget_sheets_year_type
  ON budget_sheets(user_id, budget_type, year, month);

COMMENT ON COLUMN budget_sheets.year  IS 'Calendar year (e.g. 2026). Groups monthly sheets into yearly folders.';
COMMENT ON COLUMN budget_sheets.month IS '1–12 for monthly sheets. NULL = annual summary.';
