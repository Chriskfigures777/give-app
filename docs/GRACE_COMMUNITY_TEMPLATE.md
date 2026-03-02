# Grace Community Template — Detailed Documentation

## Overview

The **Grace Community** template is a full church website template designed for faith-based organizations. It is one of 10 pre-built website templates in the website builder system, featuring a sophisticated design with gold accents and elegant typography.

---

## Design System

### Color Palette

| Variable | Hex | Usage |
|----------|-----|-------|
| `--gold` | `#C9A84C` | Primary accent, CTAs, highlights, icons |
| `--deep` | `#1A1A2E` | Dark navy for headers, footers |
| `--navy` | `#16213E` | Secondary dark |
| `--cream` | `#FAF7F2` | Light background |
| `--text` | `#333344` | Body text |
| `--muted` | `#6B7280` | Secondary text |

### Typography

- **Headings:** Playfair Display (serif) — elegant, traditional
- **Body:** Inter (sans-serif) — clean, modern

---

## Pages Included (7 Total)

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Hero, welcome section, ministries preview, events list, giving section |
| About | `about.html` | Church history, leadership team, beliefs |
| Events | `events.html` | Upcoming events calendar and listings |
| Give | `give.html` | Online giving options and generosity information |
| Ministries | `ministries.html` | Ministry programs (children, youth, adults, etc.) |
| Media | `media.html` | Sermons, podcasts, worship recordings |
| Visit | `visit.html` | Location, service times, what to expect |

---

## CMS Blocks (Dynamic Content)

The template includes **6 CMS blocks** that can be managed through the CMS dashboard. Placeholders use the format `{{cms:block_name}}` in the HTML and are replaced with actual data at runtime.

### 1. Events List (`{{cms:events_list}}`)

- **Location:** Home page, Events page
- **Purpose:** Display upcoming church events
- **Data Source:** `events` table (managed via Eventbrite integration)

**Fields:**

| Binding ID | Display Name |
|------------|--------------|
| `events.name` | Events → Name |
| `events.description` | Events → Description |
| `events.image_url` | Events → Image URL |
| `events.start_at` | Events → Start Date |
| `events.venue_name` | Events → Location |
| `events.category` | Events → Category |
| `events.url` | Events → URL |

**HTML structure:** Uses `.events-list` with `.er` / `.erow` row classes — date badge on left, event info in center, CTA on right.

---

### 2. Events Grid (`{{cms:events_grid}}`)

- **Location:** Events page
- **Purpose:** Grid layout of events with images
- **Data Source:** Same as Events List (`events` table)
- **Visual:** Card-based grid instead of list layout

---

### 3. Featured Sermon (`{{cms:featured_sermon}}`)

- **Location:** Media page
- **Purpose:** Highlight the most recent or important sermon
- **Data Source:** `website_cms_featured_sermon` table (single row per org)

**Fields:**

| Binding ID | Display Name |
|------------|--------------|
| `featured_sermon.title` | Featured Sermon → Title |
| `featured_sermon.tag` | Featured Sermon → Tag |
| `featured_sermon.description` | Featured Sermon → Description |
| `featured_sermon.image_url` | Featured Sermon → Image URL |
| `featured_sermon.video_url` | Featured Sermon → Video URL |
| `featured_sermon.audio_url` | Featured Sermon → Audio URL |
| `featured_sermon.speaker_name` | Featured Sermon → Speaker |
| `featured_sermon.duration_minutes` | Duration (mins) |

**Rendering:** `renderFeaturedSermon()` in `website-cms-render.ts` — supports video preview on hover (YouTube or MP4).

---

### 4. Sermon Archive (`{{cms:sermon_archive}}`)

- **Location:** Media page
- **Purpose:** List of previous sermons
- **Data Source:** `website_cms_sermon_archive` table (multiple rows per org)

**Fields:**

| Binding ID | Display Name |
|------------|--------------|
| `sermon_archive.title` | Sermon Archive → Title |
| `sermon_archive.tag` | Sermon Archive → Tag |
| `sermon_archive.image_url` | Sermon Archive → Image URL |
| `sermon_archive.published_at` | Sermon Archive → Date |
| `sermon_archive.duration_minutes` | Sermon Archive → Duration |
| `sermon_archive.speaker_name` | Sermon Archive → Speaker |
| `sermon_archive.video_url` | Sermon Archive → Video URL |
| `sermon_archive.audio_url` | Sermon Archive → Audio URL |

---

### 5. Podcast (`{{cms:podcast}}`)

- **Location:** Media page
- **Purpose:** Church podcast information and episodes
- **Data Sources:**
  - Config: `website_cms_podcast_config` (single row)
  - Episodes: `website_cms_podcast_episodes` (multiple rows)

**Config fields:**

| Binding ID | Display Name |
|------------|--------------|
| `podcast.title` | Podcast → Title |
| `podcast.description` | Podcast → Description |
| `podcast.spotify_url` | Podcast → Spotify URL |
| `podcast.apple_podcasts_url` | Podcast → Apple URL |

**Episode fields:**

| Binding ID | Display Name |
|------------|--------------|
| `podcast_episodes.episode_number` | Podcast Episode → Number |
| `podcast_episodes.title` | Podcast Episode → Title |
| `podcast_episodes.published_at` | Podcast Episode → Date |
| `podcast_episodes.duration_minutes` | Podcast Episode → Duration |

---

### 6. Worship Recordings (`{{cms:worship_recordings}}`)

- **Location:** Media page
- **Purpose:** Music and worship session recordings
- **Data Source:** `website_cms_worship_recordings` table

**Fields:**

| Binding ID | Display Name |
|------------|--------------|
| `worship_recordings.title` | Worship → Title |
| `worship_recordings.subtitle` | Worship → Subtitle |
| `worship_recordings.url` | Worship → URL |

---

## CMS Block Placement Summary

| Page | File | CMS Block | Placeholder |
|------|------|-----------|-------------|
| Home | `index.html` | Events List | `{{cms:events_list}}` |
| Events | `events.html` | Events Grid | `{{cms:events_grid}}` |
| Events | `events.html` | Events List | `{{cms:events_list}}` |
| Media | `media.html` | Featured Sermon | `{{cms:featured_sermon}}` |
| Media | `media.html` | Sermon Archive | `{{cms:sermon_archive}}` |
| Media | `media.html` | Podcast | `{{cms:podcast}}` |
| Media | `media.html` | Worship Recordings | `{{cms:worship_recordings}}` |

---

## How CMS Rendering Works

### 1. Template Storage

- Static HTML templates live in `church-standalone/*.html`
- Compiled into `src/lib/templates-generated.ts` (via `scripts/generate-all-templates.mjs`)
- Used by the website builder as GrapeJS project pages

### 2. Placeholder Markers

Each CMS block is wrapped with HTML comments and a `data-cms-block` attribute:

```html
<!-- cms:events_list -->
<div class="events-list" data-cms-block="events_list">{{cms:events_list}}</div>
<!-- /cms:events_list -->
```

### 3. Runtime Replacement

When a visitor loads the site (`/site/[slug]`):

1. The system fetches the organization's CMS data from Supabase
2. Rendering functions in `src/lib/website-cms-render.ts` generate HTML:
   - `renderFeaturedSermon()`
   - `renderPodcast()`
   - `renderSermonArchive()`
   - `renderWorshipRecordings()`
   - `renderEventsList()` / `renderEventsGrid()`
3. `{{cms:xxx}}` placeholders are replaced with the rendered HTML
4. The fully rendered page is served to the visitor

### 4. Fallback Content

When no CMS data exists, renderers return default/placeholder content (e.g., sample sermon text, placeholder images).

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CMS PAGE (/dashboard/pages/cms)                       │
│  Category Nav: [Events] [Featured Sermon] [Podcast] [Archive] [Worship] │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Supabase Tables                                 │
│  events | website_cms_featured_sermon | website_cms_podcast_config       │
│  website_cms_podcast_episodes | website_cms_sermon_archive               │
│  website_cms_worship_recordings                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    website-cms-render.ts                                 │
│  Replaces {{cms:xxx}} placeholders with rendered HTML                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Public Site (/site/org-slug)                          │
│  Fully rendered HTML with organization's content                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `church-standalone/*.html` | Source HTML templates |
| `src/lib/templates-generated.ts` | Compiled templates (generated) |
| `src/lib/website-builder-templates.ts` | Template registry, preview HTML |
| `src/lib/website-cms-render.ts` | CMS block rendering functions |
| `src/app/api/website-builder/inject-cms/route.ts` | Injects CMS data into templates |
| `docs/CMS_PAGE_REDESIGN_SPEC.md` | CMS page redesign specification |

---

## Template Registration

In `website-builder-templates.ts`, the Grace Community template is registered as:

- **ID:** `church` or `church-grace`
- **Name:** "Church (Grace Community)" / "Church — Grace Style"
- **Description:** "Full church website: Home, About, Events, Give, Ministries, Media, Visit Us. All CMS blocks included."
- **Pages:** `CHURCH_GRACE_PAGES` from `templates-generated.ts`
