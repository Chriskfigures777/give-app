-- Add profile_image_url for LinkedIn-style circular org avatars
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS profile_image_url text;
