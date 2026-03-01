#!/usr/bin/env node
/**
 * Enables the Custom Access Token hook for Unit banking (unitRole in JWT).
 * Reads SUPABASE_ACCESS_TOKEN from .env.local (run via pnpm run db:enable-unit-jwt-hook)
 */
const PROJECT_REF = 'atpkddkjvvtfosuuoprm';
const HOOK_URI = 'pg-functions://postgres/public/unit_jwt_hook';

const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT;
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN in .env.local (not .env.example)');
  console.error('Add: SUPABASE_ACCESS_TOKEN=sbp_xxx — get token at https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    hook_custom_access_token_enabled: true,
    hook_custom_access_token_uri: HOOK_URI,
  }),
});

if (!res.ok) {
  const err = await res.text();
  console.error('Failed to enable hook:', res.status, err);
  process.exit(1);
}

console.log('Custom Access Token hook enabled: public.unit_jwt_hook');
console.log('Sign out and back in to get a fresh JWT with unitRole: "Admin"');
