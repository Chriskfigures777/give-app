-- Add performance indexes to reduce full table scans and prevent Supabase timeouts
-- Run via: supabase db push  OR  apply manually in Supabase SQL Editor

-- peer_requests: filter by recipient_id, recipient_type, status
CREATE INDEX IF NOT EXISTS idx_peer_requests_recipient_status ON public.peer_requests (recipient_id, recipient_type, status);
CREATE INDEX IF NOT EXISTS idx_peer_requests_created_at ON public.peer_requests (created_at DESC);

-- peer_connections: sort by created_at
CREATE INDEX IF NOT EXISTS idx_peer_connections_created_at ON public.peer_connections (created_at DESC);

-- chat_threads: filter by connection_id
CREATE INDEX IF NOT EXISTS idx_chat_threads_connection_id ON public.chat_threads (connection_id);

-- donation_campaigns: filter by organization_id
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_org_id ON public.donation_campaigns (organization_id);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_org_created ON public.donation_campaigns (organization_id, created_at DESC);

-- org_embed_cards: filter by organization_id
CREATE INDEX IF NOT EXISTS idx_org_embed_cards_org_deleted ON public.org_embed_cards (organization_id) WHERE deleted_at IS NULL;

-- fund_requests: filter by thread_id
CREATE INDEX IF NOT EXISTS idx_fund_requests_thread_id ON public.fund_requests (thread_id);

-- split_proposals: filter by thread_id
CREATE INDEX IF NOT EXISTS idx_split_proposals_thread_id ON public.split_proposals (thread_id);

-- organization_admins: filter by organization_id, user_id
CREATE INDEX IF NOT EXISTS idx_org_admins_org_user ON public.organization_admins (organization_id, user_id);
