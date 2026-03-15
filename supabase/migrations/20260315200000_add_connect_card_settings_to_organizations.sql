ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS connect_card_settings jsonb;
