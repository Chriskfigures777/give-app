-- Add website_embed_card_id: which embed card/form is used for the website builder pages.
-- null = use default form (form_customizations / first full card)
ALTER TABLE public.form_customizations
  ADD COLUMN IF NOT EXISTS website_embed_card_id uuid REFERENCES public.org_embed_cards(id) ON DELETE SET NULL;
