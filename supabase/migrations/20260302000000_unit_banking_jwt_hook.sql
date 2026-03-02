-- Adds unitRole: "individual" to every Supabase JWT so Unit's white-label
-- banking app grants users access as banking customers (RTL flow).
--
-- After running this migration:
-- 1. Go to Supabase Dashboard → Authentication → Hooks
-- 2. Add hook → Custom Access Token → select function: public.unit_jwt_hook
-- 3. Users will get unitRole in their JWT on next sign-in / token refresh
--
-- Note: "individual" is the correct role for banking end-users.
-- "Admin" is a Unit platform admin role and blocks banking access.

create or replace function public.unit_jwt_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
begin
  -- "individual" grants banking customer access in Unit's white-label app.
  -- Do NOT use "Admin" — that maps to a Unit platform role, not a customer.
  event := jsonb_set(event, '{claims,unitRole}', '"individual"');
  return event;
end;
$$;

-- Grant auth system permission to call this function
grant execute on function public.unit_jwt_hook to supabase_auth_admin;

-- Revoke from all other roles for security
revoke execute on function public.unit_jwt_hook from authenticated, anon, public;
