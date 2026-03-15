-- RPC function to safely decrement ai_credits_purchased (floor at 0).
create or replace function decrement_ai_credits_purchased(org_id uuid)
returns void
language sql
security definer
as $$
  update organizations
  set ai_credits_purchased = greatest(0, ai_credits_purchased - 1)
  where id = org_id;
$$;
