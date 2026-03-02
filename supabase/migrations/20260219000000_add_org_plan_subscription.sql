-- Add plan/billing columns to organizations table for platform subscriptions
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'website', 'pro')),
  ADD COLUMN IF NOT EXISTS plan_status TEXT CHECK (plan_status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  ADD COLUMN IF NOT EXISTS stripe_billing_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_plan_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_trial_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_billing_customer ON organizations(stripe_billing_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_plan_sub ON organizations(stripe_plan_subscription_id);
