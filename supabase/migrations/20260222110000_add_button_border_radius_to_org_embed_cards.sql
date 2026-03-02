-- Add button_border_radius to org_embed_cards for custom form styling
ALTER TABLE public.org_embed_cards
  ADD COLUMN IF NOT EXISTS button_border_radius text;
