# YouTube Live Stream Feature — Implementation Plan

**Purpose:** Orgs connect their YouTube channel to Give. When they go live on YouTube, the stream **automatically** appears on their org page and/or in the feed. Visitors see "this church does live streaming" — no manual paste. This familiarizes users with broadcast before you release a paid, church-tailored broadcast tool.

**Strategy:** Free automatic display → users and visitors see broadcast value → when paid broadcast tool launches, they already know you do this and can upgrade to an all-inclusive church broadcast tool.

---

## Overview

- **What:** Org signs in / connects their YouTube channel (OAuth)
- **When live:** Give detects they're live and automatically shows the stream on their page and/or in the feed
- **Visitor experience:** "This church streams" — broadcast is visible without the org doing anything each time
- **Later:** Paid broadcast tool = all-inclusive, church-tailored alternative to YouTube

---

## User Flow

1. **Org connects YouTube** — Dashboard: "Connect your YouTube channel" → OAuth sign-in
2. **Give stores** — `youtube_channel_id`, `youtube_access_token` (or refresh token) on org
3. **When org goes live** — Give detects via YouTube API (polling or webhook) and fetches live video ID
4. **Auto-display** — Live stream appears on org page and/or in the feed automatically
5. **Visitor sees** — "This church is live" or "Watch [Church] live" — no manual action by org each time

---

## Implementation Components

### 1. YouTube OAuth Connection

- **Dashboard:** Settings or Customization: "Connect YouTube" button
- **OAuth flow:** Google/YouTube OAuth (same credentials; YouTube is part of Google)
- **Store:** `organizations.youtube_channel_id`, `organizations.youtube_refresh_token` (encrypted)
- **Scopes:** `youtube.readonly` or `youtube.force-ssl` to read channel and live stream status

### 2. Detect When Channel Is Live

**Option A: Polling (simpler)**
- Cron job or background worker every 5–15 min
- For each org with `youtube_channel_id`: call YouTube Data API v3 `search.list` with `eventType=live`, `channelId=...`
- If live: get `videoId`, store in `organizations.youtube_live_video_id` (or a `live_streams` table)
- When no longer live: clear the field

**Option B: YouTube PubSubHubbub (webhook)**
- Subscribe to channel's feed; YouTube notifies when new video/live goes up
- More real-time but more setup

**Recommendation:** Start with polling. Simpler; 5–15 min delay is acceptable.

### 3. Where to Show the Live Stream

| Location | Behavior |
|----------|----------|
| **Org page** (`/org/[slug]`) | If `youtube_live_video_id` is set, show embed section: "Watch Live" with iframe. When not live, hide or show "Check back for our next stream." |
| **Feed** | New feed item type: `youtube_live`. When org goes live, insert feed item: "\[Church] is live" with link/embed. Users following/connected to that org see it. |

### 4. Database

- `organizations.youtube_channel_id` (text, nullable)
- `organizations.youtube_refresh_token` (text, nullable, encrypted)
- `organizations.youtube_live_video_id` (text, nullable) — current live video ID, cleared when stream ends
- Optional: `live_stream_feed_items` or use existing `feed_items` with `item_type: 'youtube_live'`

### 5. Org Page Display

- On `/org/[slug]`: if `org.youtube_live_video_id` exists, render a "Watch Live" section with YouTube embed
- 16:9 iframe, "LIVE" badge
- When not live: section hidden or shows "We stream on YouTube — check back for our next service"

### 6. Feed Display

- When org goes live: create `feed_items` row with `item_type: 'youtube_live'`, `payload: { organization_id, video_id, title }`
- Feed card: "\[Org name] is live" + thumbnail/embed + "Watch" link
- Reuse existing feed infrastructure (see `FEED_AND_DONATIONS_PLAN.md`)

---

## Data Flow

```
Org connects YouTube (OAuth)
  → Store youtube_channel_id, youtube_refresh_token

Cron / worker (every 10 min)
  → For each org with youtube_channel_id: YouTube API "is this channel live?"
  → If yes: set youtube_live_video_id, optionally insert feed_items
  → If no: clear youtube_live_video_id

Org page load
  → If youtube_live_video_id: render "Watch Live" embed

Feed load
  → Include feed_items where item_type = 'youtube_live'
  → Render "Org is live" cards
```

---

## Google Cloud / YouTube API Setup

1. **Google Cloud Console** — Create project, enable YouTube Data API v3
2. **OAuth consent screen** — Configure for external users (churches)
3. **Credentials** — OAuth 2.0 client ID (Web application)
4. **Scopes** — `https://www.googleapis.com/auth/youtube.readonly` (read channel, search live streams)

---

## Files to Create / Modify

| File | Purpose |
|------|---------|
| `src/app/api/youtube/connect/route.ts` | Initiate OAuth, handle callback, store tokens |
| `src/app/api/youtube/disconnect/route.ts` | Remove connection |
| `src/lib/youtube/client.ts` | YouTube API client (search live, get video ID) |
| `src/app/api/cron/youtube-live-check/route.ts` | Cron: check all connected channels, update live status, insert feed items |
| `organizations` table | Add `youtube_channel_id`, `youtube_refresh_token`, `youtube_live_video_id` |
| `src/app/org/[slug]/page.tsx` | If live, render YouTube embed section |
| `src/components/feed/` | Add `YoutubeLiveCard` for feed item type `youtube_live` |
| Dashboard settings | "Connect YouTube" / "Disconnect YouTube" UI |

---

## Paid Broadcast Tool (Future)

When you build the paid tool:
- **Positioning:** "You already stream on Give. Upgrade to our all-inclusive broadcast tool — built for churches."
- **Features:** Multi-platform (YouTube + Facebook + website), scheduling, church-specific branding, maybe recording/archiving
- **Migration:** Org disconnects YouTube, connects to your broadcast tool; stream auto-posts to Give page/feed the same way

---

## Summary

1. Org connects YouTube via OAuth (one-time)
2. Give polls YouTube API to detect when channel is live
3. When live: auto-show on org page + feed
4. Visitors see "this church does broadcast" — builds familiarity
5. Paid broadcast tool later = church-tailored, all-inclusive upgrade
