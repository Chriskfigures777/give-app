-- Add notifications table to Supabase Realtime publication so that
-- clients subscribed via postgres_changes receive live INSERT events.
-- This enables the notification bell badge to update in real-time
-- without polling.

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
