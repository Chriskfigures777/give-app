-- Add form border customization to org_embed_cards (borders around Amount & Fund, Payment frequency sections)
ALTER TABLE public.org_embed_cards
  ADD COLUMN IF NOT EXISTS form_border_color text,
  ADD COLUMN IF NOT EXISTS form_border_width text DEFAULT '1px',
  ADD COLUMN IF NOT EXISTS form_border_style text DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS form_border_opacity text DEFAULT '1';
