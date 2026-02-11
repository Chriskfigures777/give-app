# Phase 2: Auth + Organizations (optional next steps)

- Ensure **handle_new_user** trigger or Edge Function creates `user_profiles` row on signup (Supabase already has trigger from migrations).
- **Silent Connect**: when a new organization is created (or onboarding completed), call `createConnectAccount` and store `stripe_connect_account_id` on `organizations`. No Stripe branding in UI.
- **Onboarding link**: only when Stripe requires KYC (e.g. first payout), show a single “Complete account setup” step that redirects to Stripe account link; return URL back to your app with platform branding.
- Add **organization creation** flow for nonprofit/church signup (form → insert org → create Connect account → attach to org).
