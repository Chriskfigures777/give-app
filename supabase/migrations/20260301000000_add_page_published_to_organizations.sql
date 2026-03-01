-- Add page_published flag to organizations.
-- Defaults to false so new accounts do NOT have a public page live until they explicitly publish.
-- Existing orgs with a Stripe Connect account (already live) are grandfathered in as published.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS page_published boolean NOT NULL DEFAULT false;

-- Grandfather existing verified orgs so their pages don't disappear
UPDATE public.organizations
  SET page_published = true
  WHERE stripe_connect_account_id IS NOT NULL;
