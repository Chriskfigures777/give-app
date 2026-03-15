-- Add purchased AI credits column to organizations.
-- This tracks bonus credits bought via Stripe on top of the plan-based monthly cap.
alter table organizations
  add column if not exists ai_credits_purchased integer not null default 0;
