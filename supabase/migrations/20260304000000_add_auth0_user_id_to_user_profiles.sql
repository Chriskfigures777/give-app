-- Add auth0_user_id for Unit banking with Auth0.
-- When using Auth0 for banking, we link Auth0 user to Supabase user and store
-- unit_customer_id by auth0_user_id (from webhook) or by user id (Supabase).

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS auth0_user_id text;

CREATE INDEX IF NOT EXISTS idx_user_profiles_auth0_user_id
ON public.user_profiles (auth0_user_id)
WHERE auth0_user_id IS NOT NULL;

COMMENT ON COLUMN public.user_profiles.auth0_user_id IS 'Auth0 user id (sub) for Unit banking; links Auth0 login to Supabase user';
