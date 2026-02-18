-- Add signup qualification columns to user_profiles for Figure Solutions lead gen
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS church_role text,
  ADD COLUMN IF NOT EXISTS needs_tech_integration_help boolean,
  ADD COLUMN IF NOT EXISTS willing_to_pay_tech_help boolean,
  ADD COLUMN IF NOT EXISTS owns_business_outside_church boolean,
  ADD COLUMN IF NOT EXISTS business_description text,
  ADD COLUMN IF NOT EXISTS business_email text,
  ADD COLUMN IF NOT EXISTS desired_tools text,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean;
