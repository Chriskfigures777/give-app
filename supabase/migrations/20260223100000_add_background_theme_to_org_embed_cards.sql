-- Add background_color, text_color, embed_form_theme to org_embed_cards for per-form styling
ALTER TABLE public.org_embed_cards
  ADD COLUMN IF NOT EXISTS background_color text,
  ADD COLUMN IF NOT EXISTS text_color text,
  ADD COLUMN IF NOT EXISTS embed_form_theme text DEFAULT 'default';
