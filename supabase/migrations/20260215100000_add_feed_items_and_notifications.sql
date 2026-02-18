-- feed_items: stores feed activity (donations, new orgs, connection requests, goal progress)
-- notifications: stores user notifications (connection requests, etc.)
-- Run via: supabase db push  OR  apply manually in Supabase SQL Editor

-- feed_items
CREATE TABLE IF NOT EXISTS public.feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('donation', 'goal_progress', 'new_org', 'connection_request')),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payload jsonb DEFAULT '{}',
  geo_region text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_items_org_created ON public.feed_items (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_created_at ON public.feed_items (created_at DESC);

ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_items_select_authenticated" ON public.feed_items;
CREATE POLICY "feed_items_select_authenticated" ON public.feed_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "feed_items_insert_service" ON public.feed_items;
CREATE POLICY "feed_items_insert_service" ON public.feed_items
  FOR INSERT TO service_role WITH CHECK (true);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;
CREATE POLICY "notifications_insert_service" ON public.notifications
  FOR INSERT TO service_role WITH CHECK (true);
