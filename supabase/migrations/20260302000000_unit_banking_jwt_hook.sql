-- Adds unitRole: "Admin" to every Supabase JWT so Unit's white-label banking
-- app grants users access to Digital Banking (RTL flow).
--
-- After running this migration:
-- 1. Go to Supabase Dashboard → Authentication → Hooks
-- 2. Add hook → Custom Access Token → select function: public.unit_jwt_hook
-- 3. Users will get unitRole in their JWT on next sign-in / token refresh

create or replace function public.unit_jwt_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
begin
  -- Inject unitRole into the JWT claims so Unit's white-label app
  -- grants Digital Banking access. "Admin" allows full banking access.
  -- "ReadOnly" would allow view-only access.
  event := jsonb_set(event, '{claims,unitRole}', '"Admin"');
  return event;
end;
$$;

-- Grant auth system permission to call this function
grant execute on function public.unit_jwt_hook to supabase_auth_admin;

-- Revoke from all other roles for security
revoke execute on function public.unit_jwt_hook from authenticated, anon, public;
