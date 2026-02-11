# Give Platform — Internal Prompts

These prompts support phased continuation. When the user says **"continue"**, re-scan the codebase and run the verification in `01-continue.md`.

## Stack (mandatory)

- **Next.js (App Router)** — primary app
- **pnpm** — package manager
- **Supabase** — Auth + DB (use MCP to inspect tables)
- **Stripe Connect Express** — backend-only, silent to users
- **Toolscript** — existing dashboard in `New Dashbord/` (reference layout/styling)
- **Zustand** — only where necessary
- **shadcn/ui + Radix** — lightweight UI
- **Minimal Framer Motion** or CSS for animations

## Hard constraints

- No excessive API routes or duplicated requests
- No overuse of React Context
- No heavy UI libs (MUI, Chakra, Ant)
- No unnecessary microservices
- Prefer server components, batched queries, single-pass logic
- pnpm install must be fast and minimal
- App must feel instant on first load

## Fee rules

- **1% platform fee** on each payment
- **30% of platform fee** → endowment fund
- All fund splitting in **webhooks**, single execution path, no duplicate/missed transfers

## User roles

1. **Nonprofit / Church** — sign up, silent Connect account, receive donations, configure forms/embeds
2. **Donor** — give, view history, tax summaries, choose fund, optionally cover fees
3. **Platform Admin** — platform-level funds, analytics, reporting
