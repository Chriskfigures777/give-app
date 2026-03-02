# CMS Page Redesign — Full Specification

## Design Goal

**Redesign the CMS page with Webflow-style categories including Events (loaded from events table/Eventbrite), Featured Sermon, Podcast, Sermon Archive, and Worship Recordings. Events are managed via Eventbrite but must load and display in the CMS page.**

---

This document maps everything discussed for the CMS page redesign: template CMS blocks, website builder bindings, data sources, form fields, layout, and implementation details.

---

## 1. Church Template CMS Blocks

**Source**: `church-standalone/*.html` → `church-template-generated.ts` (used by website builder)

| Page | File | CMS Block | Placeholder |
|------|------|-----------|-------------|
| Home | index.html | Events List | `{{cms:events_list}}` |
| Events | events.html | Events Grid | `{{cms:events_grid}}` |
| Events | events.html | Events List | `{{cms:events_list}}` |
| Media | media.html | Featured Sermon | `{{cms:featured_sermon}}` |
| Media | media.html | Sermon Archive | `{{cms:sermon_archive}}` |
| Media | media.html | Podcast | `{{cms:podcast}}` |
| Media | media.html | Worship Recordings | `{{cms:worship_recordings}}` |

---

## 2. Website Builder CMS Bindings

**Source**: `src/app/dashboard/pages/editor-frame/route.ts` (lines 259-293)

When users add CMS blocks or bind elements in the GrapesJS editor, they select from these bindings:

### Events (collection: `events`)
| Binding ID | Display Name |
|------------|--------------|
| events.name | Events → Name |
| events.description | Events → Description |
| events.image_url | Events → Image URL |
| events.start_at | Events → Start Date |
| events.venue_name | Events → Location |
| events.category | Events → Category |
| events.url | Events → URL |

### Featured Sermon (collection: `featured_sermon`)
| Binding ID | Display Name |
|------------|--------------|
| featured_sermon.title | Featured Sermon → Title |
| featured_sermon.tag | Featured Sermon → Tag |
| featured_sermon.description | Featured Sermon → Description |
| featured_sermon.image_url | Featured Sermon → Image URL |
| featured_sermon.video_url | Featured Sermon → Video URL |
| featured_sermon.audio_url | Featured Sermon → Audio URL |
| featured_sermon.speaker_name | Featured Sermon → Speaker |

### Podcast (collection: `podcast`)
| Binding ID | Display Name |
|------------|--------------|
| podcast.title | Podcast → Title |
| podcast.description | Podcast → Description |
| podcast.spotify_url | Podcast → Spotify URL |
| podcast.apple_podcasts_url | Podcast → Apple URL |

### Podcast Episodes (collection: `podcast_episodes`)
| Binding ID | Display Name |
|------------|--------------|
| podcast_episodes.episode_number | Podcast Episode → Number |
| podcast_episodes.title | Podcast Episode → Title |
| podcast_episodes.published_at | Podcast Episode → Date |
| podcast_episodes.duration_minutes | Podcast Episode → Duration |

### Worship Recordings (collection: `worship_recordings`)
| Binding ID | Display Name |
|------------|--------------|
| worship_recordings.title | Worship → Title |
| worship_recordings.subtitle | Worship → Subtitle |
| worship_recordings.url | Worship → URL |

### Sermon Archive (collection: `sermon_archive`)
| Binding ID | Display Name |
|------------|--------------|
| sermon_archive.title | Sermon Archive → Title |
| sermon_archive.tag | Sermon Archive → Tag |
| sermon_archive.image_url | Sermon Archive → Image URL |
| sermon_archive.published_at | Sermon Archive → Date |
| sermon_archive.duration_minutes | Sermon Archive → Duration |
| sermon_archive.speaker_name | Sermon Archive → Speaker |
| sermon_archive.video_url | Sermon Archive → Video URL |
| sermon_archive.audio_url | Sermon Archive → Audio URL |

---

## 3. Data Sources (Supabase)

| CMS Group | Table(s) | Managed By | Notes |
|-----------|----------|------------|-------|
| Events | `events` | Dashboard → Events (`/dashboard/events`) + Eventbrite sync | Events are managed by Eventbrite; CMS page must **load and display** them |
| Featured Sermon | `website_cms_featured_sermon` | CMS page | Single row per org (upsert on organization_id) |
| Podcast | `website_cms_podcast_config` | CMS page | Single row per org |
| Podcast Episodes | `website_cms_podcast_episodes` | CMS page | Multiple rows per org |
| Sermon Archive | `website_cms_sermon_archive` | CMS page | Multiple rows per org |
| Worship Recordings | `website_cms_worship_recordings` | CMS page | Multiple rows per org |

### Events Query (inject-cms)
```sql
SELECT id, name, description, start_at, image_url, venue_name, eventbrite_event_id, category
FROM events
WHERE organization_id = ?
  AND start_at >= NOW()
ORDER BY start_at ASC
```

---

## 4. API Routes

### Existing website-cms APIs
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/website-cms/featured-sermon` | GET, PUT | Featured sermon |
| `/api/website-cms/podcast-config` | GET, PUT | Podcast settings |
| `/api/website-cms/podcast-episodes` | GET, POST | Episodes list |
| `/api/website-cms/podcast-episodes/[id]` | PATCH, DELETE | Single episode |
| `/api/website-cms/worship-recordings` | GET, POST | Recordings list |
| `/api/website-cms/worship-recordings/[id]` | PATCH, DELETE | Single recording |
| `/api/website-cms/sermon-archive` | GET, POST | Sermon archive list |
| `/api/website-cms/sermon-archive/[id]` | PATCH, DELETE | Single sermon |

### Events API
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/events` | POST only | Create event (Eventbrite sync) |
| `/api/events/[id]` | GET, PATCH | Single event |

**Gap**: No GET `/api/events` for listing. CMS page needs to fetch events. **Add** either:
- `GET /api/events?organizationId=...` — list upcoming events (same query as inject-cms), or
- `GET /api/website-cms/events?organizationId=...` — new route for CMS events list

---

## 5. Form Field Mapping (CMS Page → API)

### Events (read-only display + link to manage)
- **Display**: name, start_at, venue_name, image_url, description (preview)
- **Actions**: "Manage Events" → `/dashboard/events`, "Create Event" → `/dashboard/events/new`
- **No edit form** — managed via Eventbrite / Events dashboard

### Featured Sermon
| Form Field | API Field | CMS Binding | Current |
|------------|-----------|-------------|---------|
| Title | title | featured_sermon.title | ✓ |
| Tag | tag | featured_sermon.tag | ✓ |
| Description | description | featured_sermon.description | ✓ |
| Image URL | image_url | featured_sermon.image_url | ✓ |
| Video URL | video_url | featured_sermon.video_url | ✓ |
| Audio URL | audio_url | featured_sermon.audio_url | ✓ |
| Speaker | speaker_name | featured_sermon.speaker_name | ✓ |
| Duration (mins) | duration_minutes | — | ✓ |

### Podcast Config
| Form Field | API Field | CMS Binding | Current |
|------------|-----------|-------------|---------|
| Title | title | podcast.title | ✓ |
| Description | description | podcast.description | ✓ |
| Spotify URL | spotify_url | podcast.spotify_url | ✓ |
| Apple Podcasts URL | apple_podcasts_url | podcast.apple_podcasts_url | ✓ |
| YouTube URL | youtube_url | — | ✓ (in API) |

### Podcast Episodes
| Form Field | API Field | CMS Binding | Current |
|------------|-----------|-------------|---------|
| Episode # | episode_number | podcast_episodes.episode_number | ✓ |
| Title | title | podcast_episodes.title | ✓ |
| Published Date | published_at | podcast_episodes.published_at | ✗ ADD |
| Duration (mins) | duration_minutes | podcast_episodes.duration_minutes | ✗ ADD |
| Audio URL | audio_url | — | ✗ ADD |

### Sermon Archive
| Form Field | API Field | CMS Binding | Current |
|------------|-----------|-------------|---------|
| Title | title | sermon_archive.title | ✓ |
| Tag | tag | sermon_archive.tag | ✓ |
| Image URL | image_url | sermon_archive.image_url | ✗ ADD |
| Published Date | published_at | sermon_archive.published_at | ✗ ADD |
| Duration (mins) | duration_minutes | sermon_archive.duration_minutes | ✓ |
| Speaker | speaker_name | sermon_archive.speaker_name | ✓ |
| Video URL | video_url | sermon_archive.video_url | ✗ ADD |
| Audio URL | audio_url | sermon_archive.audio_url | ✗ ADD |

### Worship Recordings
| Form Field | API Field | CMS Binding | Current |
|------------|-----------|-------------|---------|
| Title | title | worship_recordings.title | ✓ |
| Subtitle | subtitle | worship_recordings.subtitle | ✓ |
| Duration Text | duration_text | — | ✗ ADD |
| URL | url | worship_recordings.url | ✗ ADD |

---

## 6. Layout & Navigation

### Scroll Fix
- **Problem**: CMS page at `/dashboard/pages/cms` inherits full-screen layout (`overflow-hidden`) because `pathname.startsWith("/dashboard/pages")`.
- **Fix**: In `dashboard-layout-client.tsx`, exclude CMS:
  ```ts
  const isFullScreenBuilder =
    pathname.startsWith("/dashboard/pages") && !pathname.startsWith("/dashboard/pages/cms");
  ```

### Category Navigation (Webflow-style)
- **Desktop**: Left sidebar (~220px) with 5 categories
- **Mobile**: Horizontal tabs or dropdown

| Category | Icon | Content |
|----------|------|---------|
| Events | Calendar | Load & display events; link to manage |
| Featured Sermon | Star/Video | Single form |
| Podcast | Mic | Config form + episodes list |
| Sermon Archive | BookOpen | List of sermons (card per item) |
| Worship Recordings | Music | List of recordings (card per item) |

### Content Area
- One category visible at a time
- Scrollable main content
- Card layout for list items (episodes, sermons, recordings)

---

## 7. Files to Modify

| File | Changes |
|------|---------|
| `src/app/dashboard/dashboard-layout-client.tsx` | Exclude `/dashboard/pages/cms` from full-screen layout |
| `src/app/dashboard/pages/cms/cms-client.tsx` | Category nav, Events fetch & display, complete forms, card layout |
| `src/app/dashboard/pages/cms/page.tsx` | Optional header copy |
| `src/app/api/events/route.ts` | Add GET handler for listing events (or create `/api/website-cms/events`) |

---

## 8. Files NOT to Modify (Website Builder Safety)

- `src/lib/website-cms-render.ts`
- `src/app/api/website-builder/inject-cms/route.ts`
- `src/app/api/website-builder/strip-cms/route.ts`
- `src/app/dashboard/pages/editor-frame/route.ts`
- `src/lib/church-template-generated.ts`
- `church-standalone/*.html`
- All `/api/website-cms/*` route logic (only add form fields that map to existing API fields)

---

## 9. Events: Load and Display

**Requirement**: Events are managed by Eventbrite, but the CMS page must **load and display** them (same data shown on website).

**Implementation**:
1. Add `GET /api/events?organizationId=...` (or `/api/website-cms/events`) returning:
   - Same query as inject-cms: `organization_id`, `start_at >= now`, order by `start_at`
   - Fields: `id, name, description, start_at, image_url, venue_name, eventbrite_event_id, category`
2. In `CmsClient`, fetch events in the same `useEffect` as other CMS data
3. Events category: show card grid/list of upcoming events (name, date, venue, image)
4. Each card: link to edit (`/dashboard/events/[id]/edit`) if applicable
5. CTA: "Manage Events" → `/dashboard/events`, "Create Event" → `/dashboard/events/new`

---

## 10. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CMS PAGE (/dashboard/pages/cms)                 │
├─────────────────────────────────────────────────────────────────────────┤
│  Category Nav: [Events] [Featured Sermon] [Podcast] [Archive] [Worship]│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Content (one category at a time)                                 │   │
│  │                                                                  │   │
│  │  Events:     Fetch GET /api/events → display cards → link manage │   │
│  │  Featured:   Fetch /api/website-cms/featured-sermon → form       │   │
│  │  Podcast:    Fetch config + episodes → form + list               │   │
│  │  Archive:    Fetch /api/website-cms/sermon-archive → list         │   │
│  │  Worship:    Fetch /api/website-cms/worship-recordings → list     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   events table      website_cms_* tables    (same data used by
   (Eventbrite)      (CMS APIs)              inject-cms for site)
```
