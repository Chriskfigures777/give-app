# Search & Discovery Experience — Implementation Plan

## Implementation Summary

This document describes the Search & Discovery experience implemented for the Give platform.

## What Was Built

### Phase 1: Database & Seed Data
- **Migration:** Added `city`, `state`, `region`, and `causes` (text[]) columns to `organizations`
- **Seed data:** 12 Grand Rapids organizations (churches and nonprofits) with causes, descriptions, and location

### Phase 2: Search API
- **`GET /api/search`** — Unified search with query params: `q`, `type`, `city`, `state`, `cause`, `limit`, `offset`
- Returns organizations and events with faceted filtering

### Phase 3–4: Explore Page & Components
- **`/explore`** — Full discovery page with hero search, cause chips, filters, and result cards
- **`HeroSearch`** — Large search bar with quick chips (Churches, Nonprofits, Events, Grand Rapids)
- **`OrgResultCard`** / **`EventResultCard`** — Eventbrite-style cards with logo, badges, causes, location
- **`CauseChips`** — Browse by cause (Education, Hunger, Housing, etc.)
- **`ExploreFilters`** — Type (All/Church/Nonprofit/Event) and Location (Grand Rapids)

### Phase 5: Navigation & Entry Points
- **Explore** link in main nav
- **Find a cause** CTA in hero section
- **`/give`** index updated to promote discovery with "Find organizations" button

### Redesigned Nav Search
- Wider (280–320px), uses search API
- Includes events, location, org type badges
- "View all results" link to `/explore`
- Animated dropdown with grouped results

## File Changes

| File | Action |
|------|--------|
| `supabase/migrations/*` | Add location + causes; seed Grand Rapids orgs |
| `src/app/api/search/route.ts` | New search API |
| `src/app/explore/page.tsx` | New explore page |
| `src/components/hero-search.tsx` | New hero search component |
| `src/components/nav-search.tsx` | Redesigned with API, events, location |
| `src/components/explore/org-result-card.tsx` | New org card |
| `src/components/explore/event-result-card.tsx` | New event card |
| `src/components/explore/cause-chips.tsx` | New cause chips |
| `src/components/explore/explore-filters.tsx` | New filters |
| `src/components/hero-section.tsx` | Added "Find a cause" CTA |
| `src/components/site-nav.tsx` | Added Explore link |
| `src/app/give/page.tsx` | Promote discovery |
