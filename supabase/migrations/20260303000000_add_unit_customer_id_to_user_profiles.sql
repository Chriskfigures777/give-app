-- Add unit_customer_id to user_profiles for Unit banking integration.
-- Stores the Unit customer ID after a user completes the banking application.
-- The customer-token API uses this to exchange Supabase JWT for a Unit customer token.

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS unit_customer_id text;

COMMENT ON COLUMN public.user_profiles.unit_customer_id IS 'Unit.co customer ID for banking; set when user completes banking application';
