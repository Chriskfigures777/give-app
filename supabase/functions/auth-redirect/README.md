# auth-redirect

Supabase Edge Function for redirecting auth callbacks to Exchange Banking (BankGO).

**Do you need it?** You can also add the banking callback URL directly to Supabase Redirect URLs and pass it as `redirectTo`/`emailRedirectTo` when `return_to` is banking (no Edge Function required). This Edge Function is for the pattern where you want a single redirect URL in Supabase that then routes to BankGO (when `target=banking`) or Exchange.

When Supabase redirects after sign-in/sign-up (e.g. magic link, OAuth), use this function as `redirectTo` with `?target=banking&next=/dashboard` so the user is sent to BankGO’s `/auth/callback` with the auth `code`. BankGO then calls `exchangeCodeForSession` and completes the session on the banking domain.

**Deploy:** `supabase functions deploy auth-redirect` (or use Supabase MCP `deploy_edge_function` / `list_edge_functions` if the Supabase MCP is enabled for this project).

**Env (optional):** `BANKING_APP_URL`, `EXCHANGE_APP_URL` (defaults: BankGO and Give app production URLs).

**Supabase Dashboard:** Add the function URL to Authentication → URL Configuration → Redirect URLs, e.g.  
`https://<project-ref>.supabase.co/functions/v1/auth-redirect`

**Usage from Exchange:** When the user has a valid banking `return_to`, set Supabase `redirectTo` to  
`https://<project-ref>.supabase.co/functions/v1/auth-redirect?target=banking&next=/dashboard`
