-- Allow orgs to select which donation form the Donate button on their org page links to
ALTER TABLE public.form_customizations
ADD COLUMN IF NOT EXISTS org_page_donate_link_slug text;
