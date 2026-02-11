# Continuation Protocol (run on "continue")

When the user types **"continue"**:

1. **Re-scan the codebase**
   - List `src/`, `src/app/`, `src/lib/`, `src/components/`
   - Confirm auth, payments, webhooks, dashboards, embeds exist

2. **Stripe logic**
   - `src/lib/stripe/constants.ts`: PLATFORM_FEE_PERCENT = 1, ENDOWMENT_SHARE = 0.3
   - `src/app/api/create-payment-intent/route.ts`: application_fee_amount, transfer_data.destination
   - `src/app/api/webhooks/stripe/route.ts`: payment_intent.succeeded → insert donation, then single transfer to endowment (30% of platform fee) if endowment has stripe_connect_account_id
   - No duplicate transfers, single execution path

3. **Supabase integration**
   - Server client: `src/lib/supabase/server.ts` (createClient, createServiceClient)
   - Auth: `src/lib/auth.ts` (requireAuth, requirePlatformAdmin, requireOrgAdmin)
   - Tables: organizations, donations, donation_campaigns, endowment_funds, user_profiles, form_customizations — use existing schema, extend only when required

4. **Dashboards**
   - Next.js dashboard: `src/app/dashboard/` (layout, overview, donations, settings)
   - Batched data in dashboard page (Promise.all for donations + orgs + count)
   - Toolscript lives in `New Dashbord/` — do not remove; Next.js can load or replicate its views

5. **Performance**
   - Batch Supabase queries where possible
   - No waterfall requests in critical paths
   - Keep client bundles small (optimizePackageImports in next.config for lucide, recharts)

6. **Fix any issues** found and **improve performance** if possible.

After verification, report: what was checked, what (if anything) was fixed or improved.
