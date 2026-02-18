# AI Prompt: Give Dashboard — Functional Specification

Use this prompt to instruct an AI to design or build the Give dashboard. It describes **all functionality** without prescribing design. Design is left open so the AI can propose something better.

---

## Master Prompt (Copy & Paste)

```
You are designing/building the dashboard for Give, a nonprofit donation platform. The dashboard is the central hub for donors and organizations to manage donations, organizations, campaigns, connections, and payouts.

TECH STACK: Next.js, Supabase, Stripe Connect

DESIGN CONSTRAINT: Describe functionality only. Design is open for you to propose. Do not copy any existing layout, colors, or component structure. Focus on clarity, usability, and a cohesive visual language. You must support light/dark theme and have navigation. All functionality described below must be present.

---

## 1. Context and Product Overview

- **Product**: Give — a nonprofit donation platform
- **Dashboard purpose**: Central hub for donors and organizations to manage donations, organizations, campaigns, connections, and payouts
- **Tech stack**: Next.js, Supabase, Stripe Connect
- **Design constraint**: Describe functionality only; design is open for the AI to propose

---

## 2. User Roles and Permissions

| Role                         | Access                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Donor**                    | Overview, My donations, Settings                                                                                                           |
| **Organization admin/owner** | All org pages + Donations, Events, Goals, Givers, Public page, Customization, Donation links, Connections, Messages, Connect verify/manage |
| **Platform admin**           | Everything + Platform Admin; sees all orgs and donations                                                                                    |

- Navigation items are conditionally shown based on orgId, isPlatformAdmin, onboardingCompleted
- Connections shows a badge count for pending connection requests

---

## 3. Navigation Structure (Functional Only)

**Section: Overview**
- Overview (/dashboard) — main analytics and recent activity
- My donations (/dashboard/my-donations) — donor's own history

**Section: Organization** (when user has org)
- Donations — org's received donations
- Connections — org-to-org connections and requests
- Events — Eventbrite-synced events
- Goals — fundraising campaigns
- Givers — donor list
- Public page — org's public profile editor
- Customization — form and embed customization
- Donation links — shareable links with splits

**Section: Account**
- Settings — payout, org, automation
- Complete verification / Payout account — Stripe Connect onboarding
- Manage billing — bank and billing (when verified)
- Platform Admin — platform admin only

**Additional**
- Link to Homepage (/feed)
- User block: avatar, name, sign out, theme toggle
- Stripe test mode banner when in test mode

---

## 4. Page-by-Page Functional Requirements

### Overview (/dashboard)
- Filters: date range (start/end), organization (platform admin), status (succeeded/pending/failed)
- KPIs: Active organizations, Total givers, Total donations (filtered)
- Charts: Donation trends (line by date), Distribution by organization (pie)
- Tables: Organizations (ID, name, slug, type, status, total donations, created), Recent donations (date, endowment, campaign, status, currency, amount, email, giver, org, action)
- Actions: Export donations to CSV, View donation details (modal), Add org (platform admin)
- Campaign goals overview: Progress cards for active campaigns (amount raised vs goal, time remaining)
- Needs verification banner when org not verified

### My donations (/dashboard/my-donations)
- Summary: Total donated, YTD, Donation count
- Year-end tax summary download (PDF)
- Recurring subscriptions: list with amount, interval, org, Manage button (Stripe Customer Portal)
- Quick give: saved orgs with "Give now" links
- Donation history: amount, org, campaign, date, Receipt link, Give again link

### Donations (/dashboard/donations)
- Realtime updates via Supabase
- Summary: Total received, Total givers, Successful count
- Table: Amount, Giver, Organization, Campaign, Status, Date

### Givers (/dashboard/givers)
- Summary: Total givers, Total received, Total gifts
- Table: Giver name, Email, Total given, Gifts count, Last donation
- Givers identified by email when available, else name, else donation ID

### Connections (/dashboard/connections)
- Search orgs, send connection request
- Pending requests: accept/decline
- List of connections with link to chat thread per connection

### Messages (/dashboard/messages)
- List of conversations (other org name, link to thread)
- Chat thread: messages, send, (optionally fund requests when enabled)

### Events (/dashboard/events)
- Connect Eventbrite to create events
- Summary: Total, Upcoming, Past
- Create event (when Eventbrite connected)
- Table: Name, date/time, online flag, View (public), Edit

### Goals (/dashboard/goals)
- Create/update campaigns: name, description, goal amount, deadline
- Campaign fields: suggested amounts, minimum amount, allow recurring, allow anonymous

### Public page (/dashboard/profile)
- Inline editor for org profile: logo, hero image/video, summary, mission, goals, story, team members
- Donation section: choose embed card, layout, form display mode

### Customization (/dashboard/customization)
- Org page Donate button: select which donation link/form
- Embed cards: create/edit cards (full, compressed, goal, goal_compact, minimal), assign to campaigns, splits to connected orgs
- Form settings: suggested amounts, custom amount, endowment selection, header/subheader, thank-you message/video/CTA, colors, font, design sets, display mode, media side, splits to connected orgs
- Campaign goals: quick edit
- Embed instructions for Webflow and WordPress

### Donation links (/dashboard/donation-links)
- Create links with name, slug
- Splits: percentage to connected orgs (must sum to 100)
- Copy URL: {baseUrl}/give/{orgSlug}?link={linkSlug}

### Settings (/dashboard/settings)
- Payout account: Stripe Connect status (none, actions_required, pending, verified)
- Organization: name, website URL
- Internal splits: transfer to own bank accounts (percentage)
- Splits to other orgs: feature flag display
- Bill automation: coming soon
- Fund requests: feature flag

### Connect verify (/dashboard/connect/verify)
- Embedded Stripe Connect onboarding (business, identity, banking)
- Status: needs verification vs verified

### Connect manage (/dashboard/connect/manage)
- Bank account, billing via Stripe

### Platform Admin (/dashboard/admin)
- Platform analytics: org count, total donations, endowment count
- Feature flags: Splits, Fund requests, Bill automation
- Endowment funds: CRUD, Stripe Connect account link

### Page builder (/dashboard/page-builder)
- Visual editor for org public page (blocks, sections)

### Embed (/dashboard/embed)
- Redirects to Customization

---

## 5. Global Features

- **Floating chat bubble**: Bottom-right, thread list, open thread by ?thread= or click, send messages
- **Theme**: Light/dark toggle, persisted
- **Sidebar**: Collapsible (persisted in localStorage)
- **Auth**: Sign out via POST

---

## 6. Data Entities (Reference)

- Donations: amount_cents, status, donor_email, donor_name, organization_id, campaign_id, endowment_fund_id
- Organizations: name, slug, stripe_connect_account_id, onboarding_completed
- Donation campaigns: name, goal_amount_cents, current_amount_cents, goal_deadline, is_active
- Peer connections, peer requests, chat threads
- Form customizations, org_embed_cards, donation_links

---

## 7. API Integrations

- Stripe Connect (payouts, verification)
- Eventbrite (events)
- Supabase Realtime (donations)

---

## 8. Design Instruction

Design the UI from scratch. Do not copy the existing layout, colors, or component structure. Focus on clarity, usability, and a cohesive visual language. All functionality described above must be present.
```

---

## Key Files Reference

| Purpose | File |
|--------|------|
| Detailed page attributes | `DASHBOARD_ATTRIBUTES.md` |
| Nav structure and conditions | `src/app/dashboard/dashboard-nav.tsx` |
| Overview features | `src/app/dashboard/dashboard-overview.tsx` |

---

*Use this prompt with any AI to design or rebuild the Give dashboard while preserving all functionality and leaving design open for improvement.*
