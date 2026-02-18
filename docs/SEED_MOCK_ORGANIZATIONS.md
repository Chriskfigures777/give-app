# Seed Mock Organizations for Newsfeed Testing

Creates mock organizations, links them to your account (saved orgs + peer connections), and populates feed items so you can see content in the newsfeed at `/feed`.

## Prerequisites

- `feed_items` and `notifications` tables exist (run migration `supabase/migrations/20260215100000_add_feed_items_and_notifications.sql` if needed)
- `.env.local` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## Option 1: API (for MCP / automated use)

**POST** `/api/seed-mock-organizations` while logged in.

- Uses the current user's ID and org ID from the session
- Creates 5 mock orgs, links them to you, and adds feed items
- Returns `{ ok: true, orgsCreated, feedItemsCreated }`

Example (with auth cookie):

```bash
curl -X POST http://localhost:3000/api/seed-mock-organizations \
  -H "Cookie: sb-xxx-auth-token=..." 
```

An MCP agent or script can call this endpoint when the user is authenticated.

## Option 2: CLI script

```bash
# Seed and link to your user (donor saved orgs)
node scripts/seed-mock-organizations.mjs --user-id=YOUR_USER_UUID

# Seed and link to your org (peer connections)
node scripts/seed-mock-organizations.mjs --org-id=YOUR_ORG_UUID

# Seed both
node scripts/seed-mock-organizations.mjs --user-id=YOUR_USER_UUID --org-id=YOUR_ORG_UUID

# Seed orgs + feed items only (no links - you won't see them in feed until you save/connect)
node scripts/seed-mock-organizations.mjs
```

Get your user ID from `/api/me` when logged in, or from Supabase Auth dashboard.

## Mock organizations created

| Name                     | Slug                           | Focus        |
|--------------------------|--------------------------------|--------------|
| Sunrise Community Kitchen | sunrise-community-kitchen-mock | Hunger       |
| Green Valley Animal Rescue | green-valley-animal-rescue-mock | Animals      |
| Youth STEM Academy       | youth-stem-academy-mock        | Education    |
| Clean Water Initiative   | clean-water-initiative-mock    | Environment  |
| Harmony Arts Collective  | harmony-arts-collective-mock   | Arts / Youth |

## Feed visibility

The feed at `/feed` shows items from:

1. **donor_saved_organizations** – orgs you've saved
2. **peer_connections** – orgs connected to your organization

Use `--user-id` to populate saved orgs, or `--org-id` to populate peer connections. The API does both automatically for the logged-in user.
