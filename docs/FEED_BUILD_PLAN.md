# Feed & Notifications Build Plan

**Purpose:** Step-by-step implementation checklist for AI or developers. Reference: [FEED_AND_DONATIONS_PLAN.md](./FEED_AND_DONATIONS_PLAN.md) for full specs.

---

## Build Order

Execute in this order. Each phase has dependencies on the previous.

| Phase | Description |
|-------|-------------|
| 1 | Database (migrations, RLS, Realtime) |
| 2 | Feed API + Feed page (no real-time yet) |
| 3 | Notifications API + UI |
| 4 | Supabase Realtime subscriptions |
| 5 | Org website link |
| 6 | Feed webhook Lambda |
| 7 | Root redirect + polish |

---

## Phase 1: Database

- [ ] **1.1** Create migration for `feed_items` table
  - Columns: `id` (uuid, PK), `item_type` (text), `organization_id` (uuid, FK organizations), `payload` (jsonb), `created_at` (timestamptz), `geo_region` (text, nullable)
  - Use `mcp_supabase_apply_migration` or `supabase migration new`
- [ ] **1.2** Create migration for `notifications` table
  - Columns: `id` (uuid, PK), `user_id` (uuid, FK auth.users), `type` (text), `payload` (jsonb), `read_at` (timestamptz, nullable), `created_at` (timestamptz)
- [ ] **1.3** Add RLS policies
  - `feed_items`: SELECT for authenticated; INSERT/UPDATE via service role only
  - `notifications`: SELECT/UPDATE where `user_id = auth.uid()`; INSERT via service role
- [ ] **1.4** Enable Supabase Realtime for `feed_items` and `notifications`
  - Dashboard: Database → Replication → enable for both tables

---

## Phase 2: Feed API + Feed Page

- [ ] **2.1** Create `src/app/api/feed/route.ts`
  - GET handler
  - Query params: `limit` (default 20), `offset` (default 0)
  - Require auth (`requireAuth`)
  - Return items from `feed_items` (or compute from donations/campaigns/orgs) filtered by user connections + geo
  - Response: `{ items: [...], hasMore: boolean }`
  - For MVP: can return empty array if `feed_items` is empty; Lambda will populate later
- [ ] **2.2** Create `src/app/feed/page.tsx`
  - Server component
  - Redirect to `/login` if not authenticated
  - Render `FeedClient` (client component)
- [ ] **2.3** Create `src/app/feed/feed-client.tsx`
  - Client component
  - `useEffect` to fetch GET /api/feed on mount
  - State: `items`, `loading`, `hasMore`
  - Render list of `FeedItemCard` for each item
  - Layout: two-column (feed left, sidebar right) on desktop; single column on mobile
  - Match design: `min-h-screen bg-gradient-to-b from-slate-50 to-white`, `max-w-7xl mx-auto px-6 py-10`
- [ ] **2.4** Create `src/components/feed/feed-item-card.tsx`
  - Props: `item` (id, item_type, organization_id, organization_name, organization_slug, payload, created_at)
  - Switch on `item_type`: render `DonationCard` | `GoalProgressCard` | `NewOrgCard` | `ConnectionRequestCard`
  - Card container: `rounded-2xl border border-slate-200/80 bg-white shadow-sm p-4 hover:border-emerald-200 hover:shadow-lg transition-all`
  - Use `motion` for `initial`/`animate` with stagger
- [ ] **2.5** Create `src/components/feed/feed-sidebar.tsx`
  - Fetch saved + connected orgs (use `/api/peers/connections` or similar)
  - Section "Your organizations": list with avatar, name, "Visit" link to `/org/[slug]`
  - Section "Discover": when few connections, show geo-based orgs (link to Explore or fetch suggested)
  - Empty state: "Discover organizations" → `/explore`

---

## Phase 3: Notifications API + UI

- [ ] **3.1** Create `src/app/api/notifications/route.ts`
  - GET: return `{ notifications: [...], unreadCount: number }` for current user
  - Filter: `user_id = auth.uid()`, order by `created_at` DESC
- [ ] **3.2** Create `src/app/api/notifications/[id]/read/route.ts`
  - POST: set `read_at = now()` for notification where `user_id = auth.uid()` and `id` matches
- [ ] **3.3** Create `src/app/api/notifications/read-all/route.ts`
  - POST: set `read_at = now()` for all notifications where `user_id = auth.uid()` and `read_at IS NULL`
- [ ] **3.4** Create `src/components/nav-notifications-dropdown.tsx`
  - Similar structure to `NavMessagesDropdown` (see `src/components/nav-messages-dropdown.tsx`)
  - Props: `open`, `onClose`, `anchorRef`
  - Fetch GET /api/notifications when `open`
  - Render list of notification items; for `connection_request` show Accept/Decline buttons
  - Call POST read when user clicks Accept/Decline or marks read
  - Header: "Notifications" + "Mark all as read" link
- [ ] **3.5** Add bell icon + `NavNotificationsDropdown` to `src/components/site-nav.tsx`
  - Add state `notificationsOpen`
  - Add bell button (same style as Messages/Connections)
  - Badge: show unread count when > 0; red circle or "9+"
  - Render `NavNotificationsDropdown` when open
  - Only show when user is logged in

---

## Phase 4: Supabase Realtime

- [ ] **4.1** In `feed-client.tsx`, add Supabase subscription
  - `supabase.channel('feed-items').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_items' }, callback)`
  - On INSERT: prepend `payload.new` to `items` state (filter by user's visibility if needed)
- [ ] **4.2** In `nav-notifications-dropdown.tsx`, add Supabase subscription
  - `supabase.channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + userId }, callback)`
  - On INSERT: prepend to notifications list, increment unread count

---

## Phase 5: Org Website Link

- [ ] **5.1** Add website URL input to dashboard
  - Location: `src/app/dashboard/settings/page.tsx` or page builder
  - Input type url, label "Organization website"
  - Save to `organizations.website_url` via API
- [ ] **5.2** Create or update API to PATCH `organizations.website_url`
  - e.g. `src/app/api/organization-profile/route.ts` or new route
- [ ] **5.3** On org public page `src/app/org/[slug]/page.tsx`
  - When `org.website_url` is set, render link: "Visit our website" with ExternalLink icon
  - Place in hero section or about section (see OrgHero or OrgAboutSection)

---

## Phase 6: Feed Webhook Lambda

- [ ] **6.1** Create `lambda/feed-webhook/` directory
  - Copy structure from `lambda/stripe-webhook/` (package.json, tsconfig, etc.)
  - Entry: `src/index.ts`
- [ ] **6.2** Implement Lambda handler
  - Receive POST with body `{ type, payload }` (or Supabase webhook payload)
  - Validate payload
  - Use Supabase client (service role) to INSERT into `feed_items` and/or `notifications`
  - Map event types: donation → feed_items; peer_request → notifications + feed_items; etc.
- [ ] **6.3** Deploy Lambda with Function URL
  - Use existing deploy scripts pattern (see `scripts/deploy-lambda.mjs`)
- [ ] **6.4** Configure Supabase Database Webhooks
  - `donations` INSERT → POST to Lambda URL
  - `peer_requests` INSERT → POST to Lambda URL
  - `organizations` INSERT → POST to Lambda URL
  - (Goal progress: may need trigger on `donation_campaigns` UPDATE or call from Stripe webhook)

---

## Phase 7: Root Redirect + Polish

- [ ] **7.1** Redirect `/` to `/feed` when logged in
  - In `src/app/page.tsx`: server component, check session, redirect if logged in
  - Or in `src/middleware.ts`: if path is `/` and session exists, redirect to `/feed`
- [ ] **7.2** Update dashboard "Homepage" link in `src/app/dashboard/layout.tsx`
  - Change href from `/` to `/feed`
- [ ] **7.3** Update `SiteNav` for logged-in users
  - "Home" link points to `/feed`
- [ ] **7.4** Test end-to-end
  - Create donation → verify feed item appears (after Lambda + webhook config)
  - Create connection request → verify notification appears
  - Mark notification read → verify badge updates

---

## Reference Files

| Purpose | File |
|---------|------|
| Card design | `src/components/explore/org-result-card.tsx` |
| Messages dropdown pattern | `src/components/nav-messages-dropdown.tsx` |
| Site nav | `src/components/site-nav.tsx` |
| Auth | `src/lib/auth.ts` |
| Supabase client | `src/lib/supabase/client.ts` |
| Stripe Lambda (structure) | `lambda/stripe-webhook/src/index.ts` |

---

## Checklist Summary

- [ ] Phase 1: Database
- [ ] Phase 2: Feed API + Page
- [ ] Phase 3: Notifications API + UI
- [ ] Phase 4: Realtime
- [ ] Phase 5: Org website
- [ ] Phase 6: Feed webhook Lambda
- [ ] Phase 7: Redirect + polish
