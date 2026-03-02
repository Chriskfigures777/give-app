-- Feed social features: comments, reactions (support), posts, shares
-- Extends feed_items with new item types and adds feed_item_comments, feed_item_reactions

-- 1. Update feed_items: add post, share; add author columns
ALTER TABLE public.feed_items
  DROP CONSTRAINT IF EXISTS feed_items_item_type_check;

ALTER TABLE public.feed_items
  ADD CONSTRAINT feed_items_item_type_check
  CHECK (item_type IN (
    'donation', 'goal_progress', 'new_org', 'connection_request',
    'post', 'share'
  ));

ALTER TABLE public.feed_items
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS author_type text CHECK (author_type IS NULL OR author_type IN ('user', 'organization'));

-- Allow authenticated users to insert (for posts, shares)
DROP POLICY IF EXISTS "feed_items_insert_service" ON public.feed_items;
CREATE POLICY "feed_items_insert_service" ON public.feed_items
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "feed_items_insert_authenticated" ON public.feed_items;
CREATE POLICY "feed_items_insert_authenticated" ON public.feed_items
  FOR INSERT TO authenticated
  WITH CHECK (
    item_type IN ('post', 'share')
    AND organization_id IS NOT NULL
  );

-- 2. feed_item_comments
CREATE TABLE IF NOT EXISTS public.feed_item_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id uuid NOT NULL REFERENCES public.feed_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_item_comments_feed_item ON public.feed_item_comments (feed_item_id);
CREATE INDEX IF NOT EXISTS idx_feed_item_comments_created ON public.feed_item_comments (feed_item_id, created_at);

ALTER TABLE public.feed_item_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_item_comments_select_authenticated" ON public.feed_item_comments;
CREATE POLICY "feed_item_comments_select_authenticated" ON public.feed_item_comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "feed_item_comments_insert_authenticated" ON public.feed_item_comments;
CREATE POLICY "feed_item_comments_insert_authenticated" ON public.feed_item_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feed_item_comments_delete_own" ON public.feed_item_comments;
CREATE POLICY "feed_item_comments_delete_own" ON public.feed_item_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. feed_item_reactions (support)
CREATE TABLE IF NOT EXISTS public.feed_item_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id uuid NOT NULL REFERENCES public.feed_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'support' CHECK (reaction_type = 'support'),
  created_at timestamptz DEFAULT now(),
  UNIQUE (feed_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_item_reactions_feed_item ON public.feed_item_reactions (feed_item_id);

ALTER TABLE public.feed_item_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_item_reactions_select_authenticated" ON public.feed_item_reactions;
CREATE POLICY "feed_item_reactions_select_authenticated" ON public.feed_item_reactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "feed_item_reactions_insert_own" ON public.feed_item_reactions;
CREATE POLICY "feed_item_reactions_insert_own" ON public.feed_item_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feed_item_reactions_delete_own" ON public.feed_item_reactions;
CREATE POLICY "feed_item_reactions_delete_own" ON public.feed_item_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
