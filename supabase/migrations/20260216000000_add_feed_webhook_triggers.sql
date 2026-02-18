-- Feed webhook triggers: peer_requests, donations, organizations INSERT → pg_net → Lambda
-- Uses app_config.feed_webhook_url. Set via: UPDATE app_config SET value = '<LAMBDA_URL>' WHERE key = 'feed_webhook_url';
-- Run create-feed-webhook-url.mjs to deploy Lambda and get URL, then update app_config.

CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- Placeholder; run create-feed-webhook-url.mjs then: UPDATE app_config SET value = '<url>' WHERE key = 'feed_webhook_url';
INSERT INTO public.app_config (key, value) VALUES ('feed_webhook_url', '') ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.notify_feed_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_url text;
  payload jsonb;
BEGIN
  SELECT value INTO webhook_url FROM public.app_config WHERE key = 'feed_webhook_url';
  IF webhook_url IS NULL OR trim(webhook_url) = '' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END
  );

  -- Only fire on INSERT for feed webhook (Lambda expects INSERT events)
  IF TG_OP <> 'INSERT' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM net.http_post(
    url := webhook_url,
    body := payload,
    params := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

-- peer_requests: connection requests → notifications for recipient
DROP TRIGGER IF EXISTS feed_webhook_peer_requests ON public.peer_requests;
CREATE TRIGGER feed_webhook_peer_requests
  AFTER INSERT ON public.peer_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_feed_webhook();

-- donations: new donations → feed_items
DROP TRIGGER IF EXISTS feed_webhook_donations ON public.donations;
CREATE TRIGGER feed_webhook_donations
  AFTER INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_feed_webhook();

-- organizations: new orgs → feed_items
DROP TRIGGER IF EXISTS feed_webhook_organizations ON public.organizations;
CREATE TRIGGER feed_webhook_organizations
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_feed_webhook();
