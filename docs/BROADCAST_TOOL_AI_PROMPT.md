# Church Broadcast Tool — Comprehensive AI Prompt

**Purpose:** This document is a complete, detailed specification for building the Church Broadcast Tool in a new codebase. Use it as the primary reference when implementing the app. Every feature, flow, table, and integration is described in full.

---

# Part 1: Product Vision & Business Context

## 1.1 What Is the Broadcast Tool?

The Church Broadcast Tool is a **paid SaaS product** for churches that combines:

1. **Live streaming** — Multi-platform broadcast (YouTube, Facebook, website) with professional audio/video
2. **AI-powered engagement** — AI listens to sermons, generates questions, sends them to members, and gives pastors visibility into who is learning
3. **Podcast automation** — Extracts audio from streams and auto-publishes to iTunes, Spotify, and other podcast platforms
4. **Audio editing** — Visual waveform editor for compression, EQ, and post-production (future phase)

## 1.2 Relationship to Give

| Aspect | Give | Broadcast Tool |
|--------|------|----------------|
| **Product** | Donation platform (free/low-cost) | Live streaming + AI engagement (paid) |
| **Purpose** | Lead magnet, list builder | Revenue product |
| **Codebase** | This repo | New repo |
| **Deployment** | give.com (or similar) | broadcast.give.com (subdomain) |
| **Supabase** | Same project | Same project |
| **Auth** | auth.users, user_profiles | Same — user logs in once |
| **Organizations** | Same organizations table | Same — churches are shared |
| **Tables** | donations, campaigns, etc. | New broadcast_* tables only |

**Critical:** The broadcast tool MUST use the same Supabase project. Users who sign up on Give can log into the broadcast tool with the same credentials. No duplicate accounts.

## 1.3 Business Model

- **Subscription:** Churches pay monthly (Stripe)
- **Plans:** Stream ($49/mo), Engage ($79/mo), Pro ($99–129/mo) — tiers with different feature access
- **Credits:** AI usage (question generation) may consume credits; higher plans include more
- **Free trial:** 14 days to test before paying

## 1.4 Target User

- **Primary:** Church pastors, worship leaders, media directors
- **Secondary:** Church staff (admin, communications)
- **End beneficiary:** Church members (viewers who receive questions and answer them)

---

# Part 2: User Personas & Roles

## 2.1 Pastor / Church Leader

- **Can do:** Start/stop streams, view engagement dashboard, see who answered questions, identify members who need follow-up, manage subscription
- **Sees:** Stream status, live viewer count, post-sermon engagement metrics, member response rates, individual member scores

## 2.2 Church Staff (Admin, Media)

- **Can do:** Same as pastor for streams and engagement; may have limited access to billing
- **Role:** organization_admin in user_profiles, or broadcast_staff in broadcast_org_members

## 2.3 Church Member

- **Can do:** Watch live stream, receive questions (push or in-app), answer questions
- **Sees:** Stream player, question form, confirmation after answering
- **Note:** Members may not have accounts initially; they could receive a link + phone number for push. Or they have user_profiles with organization_id linking them to the church.

## 2.4 Platform Admin

- **Can do:** View all orgs, manage subscriptions, support
- **Role:** platform_admin in user_profiles

---

# Part 3: Complete Feature Breakdown

## 3.1 Live Streaming Module

### 3.1.1 Stream Setup (Pre-Stream)

- **Screen:** "New Stream" or "Schedule Stream"
- **Fields:**
  - Stream title (e.g., "Sunday Service — March 15")
  - Scheduled start time (optional)
  - Destinations: YouTube, Facebook, custom RTMP URL, embed on church website
  - Audio/video source: Webcam, OBS, external encoder
- **Actions:** Create LiveKit room, generate ingest URL (RTMP or WebRTC), generate viewer URL
- **Output:** Ingest URL for OBS/encoder; viewer URL for website/embed

### 3.1.2 Live Stream (During)

- **Screen:** "Live" control panel
- **Shows:** Live preview, viewer count, destination status (YouTube live, Facebook live, etc.), record button
- **Actions:** Stop stream, start recording, view real-time transcript (if AI is running)
- **Technical:** LiveKit room active; egress to YouTube/Facebook via LiveKit Egress or RTMP push

### 3.1.3 Post-Stream

- **Screen:** "Stream ended" — summary
- **Shows:** Duration, viewer peak, recording status
- **Actions:** View recording, trigger AI processing, extract audio for podcast

### 3.1.4 Stream History

- **Screen:** List of past streams
- **Columns:** Date, title, duration, viewers, status (processed/not processed)
- **Actions:** View details, re-process AI, download recording

---

## 3.2 AI Engagement Module

### 3.2.1 Real-Time Transcription (During Stream)

- **What:** Speech-to-text (STT) runs on live audio
- **Tech:** LiveKit Agent subscribes to room audio → sends to Deepgram/Whisper → transcript stream
- **Storage:** Transcript chunks saved to broadcast_streams or broadcast_transcript_chunks as stream progresses
- **Output:** Full transcript available when stream ends

### 3.2.2 Scripture Detection

- **What:** AI identifies when pastor cites scripture (e.g., "John 3:16", "Romans 8")
- **How:** LLM or regex on transcript segments; store references in broadcast_sermons.scripture_refs
- **Format:** `[{ "ref": "John 3:16", "context": "For God so loved the world..." }]`

### 3.2.3 Question Generation (Post-Stream)

- **Trigger:** Stream ends → background job starts
- **Input:** Full transcript, scripture_refs, sermon title
- **Process:** LLM prompt: "Generate 5-7 comprehension and reflection questions based on this sermon. Include questions about scripture cited. Mix: recall, application, reflection."
- **Output:** broadcast_questions rows (sermon_id, question_text, question_type, scripture_ref, sort_order)
- **Question types:** recall, scripture, application, reflection

### 3.2.4 Sending Questions to Members

- **When:** After questions generated (within minutes of stream end)
- **Channels:** Push notification (phone), in-app notification, email (optional)
- **Payload:** "Reflection questions from [Sermon Title] are ready. Tap to answer."
- **Link:** Deep link to broadcast app or web: /sermons/[sermonId]/questions

### 3.2.5 Member Response Collection

- **Screen:** Question form (mobile or web)
- **Shows:** Sermon title, 5-7 questions (text input or multiple choice)
- **Actions:** Submit answers
- **Storage:** broadcast_member_responses (question_id, user_id, response_text, created_at)

### 3.2.6 Pastor Engagement Dashboard

- **Screen:** "Engagement" or "Sermon Insights"
- **Metrics:**
  - Total members who received questions
  - Response rate (% who answered)
  - Per-question: % correct (if applicable), common answers
  - Per-member: who answered, who didn't, scores
- **Lists:**
  - Members who didn't engage → follow-up list
  - Members who scored low → pastoral care list
- **Filters:** By sermon, by date range, by member

---

## 3.3 Podcast Automation Module

### 3.3.1 Audio Extraction

- **Trigger:** Stream ends and recording available
- **Process:** Extract audio track from video (ffmpeg or LiveKit recording)
- **Output:** MP3 or M4A file
- **Storage:** Upload to S3; URL stored in broadcast_podcast_episodes.audio_url

### 3.3.2 Podcast Metadata

- **Fields:** Episode title (from stream title), description (from transcript summary), publish date
- **Artwork:** Use church logo or default

### 3.3.3 Publishing to Platforms

- **iTunes/Apple Podcasts:** Submit RSS feed or use podcast API
- **Spotify:** Spotify for Podcasters API
- **Others:** RSS feed distribution
- **Storage:** broadcast_podcast_episodes.podcast_platforms = { "spotify": "url", "apple": "url" }

### 3.3.4 RSS Feed

- **Endpoint:** /api/podcast/[orgSlug]/feed.xml
- **Content:** Standard podcast RSS with episodes from broadcast_podcast_episodes

---

## 3.4 Member Management Module

### 3.4.1 Member List

- **Screen:** "Members" — list of people who can receive questions
- **Source:** broadcast_members table (organization_id, user_id, phone, email, push_token, opted_in)
- **Actions:** Add member, remove, edit, import from CSV

### 3.4.2 Member Onboarding

- **Flow:** Church shares signup link; member enters phone/email, opts in for notifications
- **Or:** Member has Give account; church links user_id to org as member

### 3.4.3 Push Token Registration

- **When:** Member opens app or web, grants notification permission
- **Storage:** broadcast_members.push_token (FCM token or web push subscription)

---

## 3.5 Subscription & Billing Module

### 3.5.1 Plans

| Plan | Price | Streams/mo | AI Credits | Podcast | Support |
|------|-------|------------|------------|---------|---------|
| Stream | $49 | 8 | 4 | No | Email |
| Engage | $79 | 16 | 12 | Yes | Email |
| Pro | $129 | Unlimited | 30 | Yes | Priority |

### 3.5.2 Checkout

- **Flow:** Stripe Checkout or Customer Portal
- **Webhook:** stripe webhook for subscription created/updated/canceled
- **Storage:** broadcast_subscriptions (organization_id, stripe_subscription_id, plan, status, current_period_end)

### 3.5.3 Usage Tracking

- **Credits:** Each AI question generation = 1 credit
- **Storage:** broadcast_credits (organization_id, credits_used, credits_remaining, period_start, period_end)

---

## 3.6 Audio Editor (Future Phase)

- **Screen:** Waveform editor
- **Features:** Visual waveform, trim, compression, EQ, noise reduction
- **Input:** Audio from stream recording
- **Output:** Edited audio for podcast or re-upload

---

# Part 4: Detailed User Flows

## 4.1 Flow: Pastor Starts a Live Stream

1. Pastor logs into broadcast app (same login as Give)
2. Navigates to Dashboard → "New Stream"
3. Enters stream title: "Sunday Service — March 15"
4. Selects destinations: YouTube, Facebook, Website embed
5. Clicks "Start Stream"
6. System creates LiveKit room, generates RTMP ingest URL
7. Pastor copies ingest URL into OBS, starts streaming from OBS
8. Broadcast app shows "Live" — viewer count, destination status
9. AI Agent (if enabled) joins room, begins transcribing
10. Pastor preaches; transcript accumulates
11. Pastor clicks "End Stream"
12. System stops egress, ends room, saves recording
13. Background job: save transcript, run question generation
14. Within 5–10 min: questions generated, push sent to members

## 4.2 Flow: Member Receives and Answers Questions

1. Member has phone with broadcast app (or web) and push enabled
2. Push notification: "Reflection questions from Sunday Service are ready"
3. Member taps → opens app to /sermons/[id]/questions
4. Sees sermon title and 5–7 questions
5. Types answers (or selects multiple choice if applicable)
6. Clicks "Submit"
7. Responses saved to broadcast_member_responses
8. Confirmation: "Thanks! Your responses help [Church] understand how the message landed."

## 4.3 Flow: Pastor Views Engagement Dashboard

1. Pastor navigates to "Engagement" or "Sermon Insights"
2. Selects sermon: "Sunday Service — March 15"
3. Sees: 120 members received questions, 45 responded (37.5% response rate)
4. Expands "Who didn't respond" → list of 75 members
5. Expands "Responses" → sees individual answers per question
6. Notes: Question 3 had low scores → considers revisiting topic next week
7. Exports "Follow-up list" for pastoral team

## 4.4 Flow: Podcast Auto-Publish

1. Stream ends, recording saved
2. Lambda triggered (or EventBridge schedule)
3. Lambda downloads recording, extracts audio (ffmpeg)
4. Uploads MP3 to S3
5. Creates broadcast_podcast_episodes row
6. Lambda calls Spotify for Podcasters API, Apple Podcasts API (or updates RSS)
7. Episode appears on Spotify/Apple within hours

---

# Part 5: Complete Database Schema

## 5.1 Shared Tables (Existing — Do Not Modify)

- `auth.users` — Supabase Auth
- `user_profiles` — id, email, full_name, role, organization_id, preferred_organization_id
- `organizations` — id, name, slug, owner_user_id, etc.

## 5.2 New Tables (Broadcast-Specific)

### broadcast_subscriptions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| organization_id | uuid | NO | — | FK organizations |
| stripe_subscription_id | text | YES | — | Stripe sub_* |
| stripe_customer_id | text | YES | — | Stripe cus_* |
| plan | text | NO | — | 'stream', 'engage', 'pro' |
| status | text | NO | 'active' | 'active', 'canceled', 'past_due', 'trialing' |
| current_period_start | timestamptz | YES | — | Billing period start |
| current_period_end | timestamptz | YES | — | Billing period end |
| cancel_at_period_end | boolean | NO | false | — |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

**Indexes:** organization_id (unique where status='active'), stripe_subscription_id (unique)

### broadcast_streams

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| organization_id | uuid | NO | — | FK organizations |
| title | text | NO | — | Stream title |
| livekit_room_name | text | YES | — | LiveKit room identifier |
| livekit_room_sid | text | YES | — | LiveKit room SID |
| status | text | NO | 'scheduled' | 'scheduled', 'live', 'ended', 'processing', 'completed', 'failed' |
| scheduled_start_at | timestamptz | YES | — | When stream was scheduled |
| started_at | timestamptz | YES | — | When stream actually started |
| ended_at | timestamptz | YES | — | When stream ended |
| duration_seconds | integer | YES | — | Calculated duration |
| viewer_peak_count | integer | YES | 0 | Peak concurrent viewers |
| recording_url | text | YES | — | S3 or LiveKit recording URL |
| youtube_video_id | text | YES | — | If egressed to YouTube |
| facebook_video_id | text | YES | — | If egressed to Facebook |
| rtmp_output_urls | jsonb | YES | '[]' | Custom RTMP destinations |
| created_by_user_id | uuid | YES | — | FK auth.users |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

**Indexes:** organization_id, status, started_at DESC

### broadcast_transcripts

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| stream_id | uuid | NO | — | FK broadcast_streams |
| organization_id | uuid | NO | — | FK organizations |
| full_text | text | YES | — | Complete transcript |
| raw_chunks | jsonb | YES | '[]' | [{ "text", "timestamp", "speaker" }] |
| word_count | integer | YES | — | — |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

**Indexes:** stream_id (unique), organization_id

### broadcast_sermons

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| stream_id | uuid | NO | — | FK broadcast_streams |
| organization_id | uuid | NO | — | FK organizations |
| title | text | NO | — | From stream title |
| transcript_id | uuid | YES | — | FK broadcast_transcripts |
| scripture_refs | jsonb | NO | '[]' | [{ "ref", "context", "timestamp" }] |
| main_points | jsonb | YES | '[]' | AI-extracted main points |
| summary | text | YES | — | AI-generated summary |
| ai_processing_status | text | NO | 'pending' | 'pending', 'processing', 'completed', 'failed' |
| ai_processed_at | timestamptz | YES | — | When AI finished |
| credits_used | integer | YES | 0 | Credits consumed |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

**Indexes:** stream_id (unique), organization_id, ai_processing_status

### broadcast_questions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| sermon_id | uuid | NO | — | FK broadcast_sermons |
| organization_id | uuid | NO | — | FK organizations |
| question_text | text | NO | — | The question |
| question_type | text | NO | 'reflection' | 'recall', 'scripture', 'application', 'reflection' |
| scripture_ref | text | YES | — | If about a verse |
| sort_order | integer | NO | 0 | Display order |
| is_required | boolean | NO | false | Must answer to submit |
| created_at | timestamptz | NO | now() | — |

**Indexes:** sermon_id, organization_id

### broadcast_members

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| organization_id | uuid | NO | — | FK organizations |
| user_id | uuid | YES | — | FK auth.users (if has account) |
| email | text | YES | — | For email notifications |
| phone | text | YES | — | For SMS/push |
| full_name | text | YES | — | Display name |
| push_token | text | YES | — | FCM or web push token |
| push_platform | text | YES | — | 'ios', 'android', 'web' |
| opted_in | boolean | NO | true | Consent for notifications |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

**Indexes:** organization_id, (organization_id, email) unique, (organization_id, user_id) unique where user_id not null

### broadcast_member_responses

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| question_id | uuid | NO | — | FK broadcast_questions |
| sermon_id | uuid | NO | — | FK broadcast_sermons (denormalized) |
| organization_id | uuid | NO | — | FK organizations |
| user_id | uuid | YES | — | FK auth.users (if logged in) |
| member_id | uuid | YES | — | FK broadcast_members (if no user) |
| response_text | text | NO | — | Answer |
| response_score | numeric | YES | — | If auto-graded (0-1) |
| created_at | timestamptz | NO | now() | — |

**Indexes:** question_id, sermon_id, organization_id, user_id, (question_id, user_id) unique for one answer per user per question

### broadcast_question_sends

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| sermon_id | uuid | NO | — | FK broadcast_sermons |
| organization_id | uuid | NO | — | FK organizations |
| channel | text | NO | — | 'push', 'email', 'in_app' |
| recipient_count | integer | NO | 0 | How many received |
| sent_at | timestamptz | NO | now() | — |

**Indexes:** sermon_id

### broadcast_podcast_episodes

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| sermon_id | uuid | NO | — | FK broadcast_sermons |
| organization_id | uuid | NO | — | FK organizations |
| stream_id | uuid | NO | — | FK broadcast_streams |
| title | text | NO | — | Episode title |
| description | text | YES | — | Episode description |
| audio_url | text | NO | — | S3 URL for MP3/M4A |
| duration_seconds | integer | YES | — | Audio length |
| podcast_platforms | jsonb | NO | '{}' | { "spotify": "url", "apple": "url" } |
| published_at | timestamptz | YES | — | When went live |
| status | text | NO | 'pending' | 'pending', 'processing', 'published', 'failed' |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

**Indexes:** sermon_id (unique), organization_id

### broadcast_credits

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| organization_id | uuid | NO | — | FK organizations |
| period_start | timestamptz | NO | — | Billing period start |
| period_end | timestamptz | NO | — | Billing period end |
| credits_included | integer | NO | — | From plan |
| credits_used | integer | NO | 0 | Consumed |
| credits_remaining | integer | NO | — | included - used |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

**Indexes:** (organization_id, period_start) unique

### broadcast_org_settings

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PK |
| organization_id | uuid | NO | — | FK organizations, unique |
| youtube_channel_id | text | YES | — | If using YouTube egress |
| facebook_page_id | text | YES | — | If using Facebook egress |
| podcast_rss_url | text | YES | — | Church's podcast RSS |
| default_question_count | integer | NO | 5 | Questions per sermon |
| push_enabled | boolean | NO | true | — |
| email_enabled | boolean | NO | true | — |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

**Indexes:** organization_id (unique)

---

## 5.3 RLS Policies (Summary)

- **broadcast_subscriptions:** Org owner/admin can read/update their org's row
- **broadcast_streams:** Org owner/admin CRUD their org's streams
- **broadcast_sermons, broadcast_questions:** Org owner/admin read; service role write
- **broadcast_members:** Org owner/admin CRUD their org's members
- **broadcast_member_responses:** Org owner/admin read; members can insert their own (with validation)
- **broadcast_podcast_episodes:** Org owner/admin read
- **broadcast_credits:** Org owner/admin read
- **broadcast_org_settings:** Org owner/admin CRUD

---

# Part 6: API Specification

## 6.1 Stream APIs

### POST /api/broadcast/streams

**Auth:** requireAuth, org admin  
**Body:** `{ title, scheduledStartAt?, destinations: { youtube?, facebook?, rtmp? } }`  
**Response:** `{ id, livekitRoomName, ingestUrl, viewerUrl, status }`

### GET /api/broadcast/streams

**Auth:** requireAuth  
**Query:** organizationId, status?, limit, offset  
**Response:** `{ streams: [...], total }`

### GET /api/broadcast/streams/[id]

**Auth:** requireAuth, org member  
**Response:** Full stream object with transcript, sermon, questions if available

### PATCH /api/broadcast/streams/[id]

**Auth:** requireAuth, org admin  
**Body:** `{ status: 'ended' }` — end stream

### POST /api/broadcast/streams/[id]/token

**Auth:** requireAuth, org admin  
**Response:** `{ token }` — LiveKit join token for host

---

## 6.2 Sermon & Questions APIs

### GET /api/broadcast/sermons/[id]

**Auth:** requireAuth, org member  
**Response:** Sermon with questions, transcript summary

### GET /api/broadcast/sermons/[id]/questions

**Auth:** Optional (member may answer via link with token)  
**Response:** Questions for form

### POST /api/broadcast/sermons/[id]/responses

**Auth:** Optional (member token or session)  
**Body:** `{ responses: [{ questionId, responseText }] }`  
**Response:** `{ success }`

### GET /api/broadcast/sermons/[id]/engagement

**Auth:** requireAuth, org admin  
**Response:** `{ totalSent, respondedCount, responseRate, byQuestion: [...], byMember: [...] }`

---

## 6.3 Member APIs

### GET /api/broadcast/members

**Auth:** requireAuth, org admin  
**Query:** organizationId  
**Response:** `{ members: [...] }`

### POST /api/broadcast/members

**Auth:** requireAuth, org admin  
**Body:** `{ email?, phone?, fullName?, userId? }`  
**Response:** `{ id }`

### PATCH /api/broadcast/members/[id]

**Auth:** requireAuth, org admin  
**Body:** `{ pushToken?, optedIn? }`

### POST /api/broadcast/members/register-push

**Auth:** requireAuth  
**Body:** `{ pushToken, platform }`  
**Response:** `{ success }`

---

## 6.4 Subscription APIs

### GET /api/broadcast/subscription

**Auth:** requireAuth  
**Query:** organizationId  
**Response:** `{ subscription, plan, status, currentPeriodEnd, creditsRemaining }`

### POST /api/broadcast/subscription/checkout

**Auth:** requireAuth, org admin  
**Body:** `{ plan, organizationId }`  
**Response:** `{ checkoutUrl }` — Stripe Checkout URL

### POST /api/broadcast/subscription/portal

**Auth:** requireAuth, org admin  
**Body:** `{ organizationId }`  
**Response:** `{ portalUrl }` — Stripe Customer Portal

---

## 6.5 Webhook APIs

### POST /api/webhooks/stripe

**Auth:** Stripe signature  
**Handles:** customer.subscription.created, updated, deleted; invoice.paid, payment_failed  
**Actions:** Upsert broadcast_subscriptions, update credits

### POST /api/webhooks/livekit

**Auth:** LiveKit webhook secret  
**Handles:** room_finished, participant_joined, participant_left  
**Actions:** Update broadcast_streams status, viewer count, trigger post-stream jobs

---

# Part 7: AI Pipeline Details

## 7.1 STT (Speech-to-Text)

- **Provider:** Deepgram (recommended) or Whisper
- **Input:** LiveKit room audio track or recorded file
- **Output:** Streaming or batch transcript
- **Format:** `{ "text": "...", "timestamp": 0.0, "duration": 1.5 }` per segment
- **Storage:** Append to broadcast_transcripts.raw_chunks; concatenate for full_text

## 7.2 Scripture Detection

- **Input:** Transcript full_text
- **Method:** Regex for patterns like "John 3:16", "Romans 8:28", "1 Corinthians 13"
- **Or:** LLM call: "Extract all scripture references from this text. Return JSON array of { ref, context }"
- **Output:** broadcast_sermons.scripture_refs

## 7.3 Question Generation LLM Prompt

```
You are generating reflection and comprehension questions for church members based on a sermon transcript.

Sermon title: {title}
Transcript: {transcript}
Scripture references mentioned: {scripture_refs}

Generate exactly {count} questions (default 5-7) that:
1. Test comprehension of main points
2. Include at least one question about scripture cited
3. Include at least one application/reflection question ("How will you apply...")
4. Are appropriate for church members of varying familiarity with the Bible

Return JSON array: [{ "question_text": "...", "question_type": "recall|scripture|application|reflection", "scripture_ref": "..." or null }]
```

## 7.4 Processing Flow (Lambda or Next.js API)

1. Stream ends → webhook or poll
2. Fetch transcript from broadcast_transcripts
3. Create broadcast_sermons row (status: processing)
4. Call scripture detection → update scripture_refs
5. Call LLM for questions → insert broadcast_questions
6. Update broadcast_sermons (status: completed, ai_processed_at)
7. Decrement broadcast_credits
8. Trigger question send (push, email)

---

# Part 8: LiveKit Integration

## 8.1 Room Creation

- **API:** LiveKit Cloud API or self-hosted
- **Create room:** POST /twirp/livekit.RoomService/CreateRoom
- **Params:** name (unique per stream), empty_reason, max_participants
- **Store:** broadcast_streams.livekit_room_name, livekit_room_sid

## 8.2 Ingest (Broadcaster Sends Video)

- **RTMP:** Generate RTMP ingest URL from LiveKit (or use LiveKit Ingress)
- **WebRTC:** Generate token for host; host uses LiveKit SDK to publish
- **OBS:** Pastor configures OBS to stream to RTMP URL

## 8.3 Egress (Send to YouTube, Facebook)

- **LiveKit Egress:** Configure egress to YouTube RTMP, Facebook RTMP
- **Or:** Use custom RTMP push from LiveKit room
- **YouTube:** Requires YouTube stream key + ingest URL
- **Facebook:** Requires Facebook stream key + ingest URL

## 8.4 Recording

- **LiveKit Egress:** Room composite or track composite
- **Output:** S3 or LiveKit storage; URL stored in broadcast_streams.recording_url

## 8.5 Agent (Real-Time Transcription)

- **LiveKit Agents:** Python or Node.js agent
- **Flow:** Agent joins room, subscribes to audio track, streams to Deepgram, receives transcript, publishes to room data or webhook
- **Storage:** Your API receives transcript chunks via webhook, appends to broadcast_transcripts

---

# Part 9: Podcast Automation

## 9.1 Audio Extraction (Lambda)

- **Trigger:** broadcast_streams.status = 'ended' and recording_url exists
- **Input:** Download recording (video) from S3 or LiveKit URL
- **Process:** `ffmpeg -i input.mp4 -vn -acodec libmp3lame -q:a 2 output.mp3`
- **Output:** Upload MP3 to S3, get URL
- **Storage:** broadcast_podcast_episodes (audio_url, status: processing)

## 9.2 Metadata

- **Title:** From broadcast_streams.title
- **Description:** From broadcast_sermons.summary or transcript first 500 chars
- **Publish date:** ended_at

## 9.3 Spotify for Podcasters

- **API:** Spotify for Podcasters (formerly Anchor)
- **Flow:** Upload episode via API; receive episode URL
- **Store:** broadcast_podcast_episodes.podcast_platforms.spotify = url

## 9.4 Apple Podcasts

- **Method:** RSS feed; Apple crawls RSS
- **RSS:** Generate at /api/podcast/[orgSlug]/feed.xml
- **Content:** Channel info + episode entries from broadcast_podcast_episodes

---

# Part 10: Push Notifications

## 10.1 Provider Options

- **Firebase Cloud Messaging (FCM)** — iOS, Android, Web
- **OneSignal** — Multi-platform, easier setup
- **AWS SNS** — Mobile push

## 10.2 Flow

1. Member registers push token (broadcast_members.push_token)
2. Sermon questions ready → fetch members with opted_in and push_token
3. Send push: title "Reflection questions from [Sermon Title]", body "Tap to answer"
4. Deep link: broadcast.give.com/sermons/[id]/questions
5. Log send in broadcast_question_sends

---

# Part 11: Stripe Integration

## 11.1 Products & Prices

- **Product:** "Broadcast — Stream" — Price $49/mo
- **Product:** "Broadcast — Engage" — Price $79/mo
- **Product:** "Broadcast — Pro" — Price $129/mo

## 11.2 Checkout

- **Stripe Checkout:** Create session with subscription, success_url, cancel_url
- **Metadata:** organization_id
- **Webhook:** subscription.created → insert broadcast_subscriptions

## 11.3 Webhook Events

- `customer.subscription.created` — Insert row
- `customer.subscription.updated` — Update plan, status, period
- `customer.subscription.deleted` — Set status canceled
- `invoice.paid` — Renew credits if new period
- `invoice.payment_failed` — Set status past_due, notify

---

# Part 12: Auth & Permissions

## 12.1 Auth Flow

1. User visits broadcast.give.com
2. Supabase client checks session (cookie)
3. If no session: redirect to give.com/login?redirect=broadcast.give.com
4. User logs in on Give; redirect back to broadcast with session
5. Session cookie domain: .give.com (shared)

## 12.2 Org Resolution

- **user_profiles.organization_id** — Primary org (if org admin)
- **user_profiles.preferred_organization_id** — Selected org
- **Check:** User must have org to use broadcast; else "Connect your church" CTA

## 12.3 Permission Checks

- **Org admin:** organizations.owner_user_id = user.id OR organization_admins (user_id, organization_id)
- **Platform admin:** user_profiles.role = 'platform_admin'
- **Member:** broadcast_members (user_id, organization_id) OR user_profiles.organization_id

---

# Part 13: UI/UX Specifications

## 13.1 Dashboard Layout

- **Sidebar:** Streams, Engagement, Members, Settings, Billing
- **Header:** Org selector, user menu, "Upgrade" if no subscription
- **Main:** Context-dependent content

## 13.2 Key Screens

### Stream List

- Table: Title, Date, Duration, Viewers, Status, Actions
- Button: "New Stream"
- Empty state: "Start your first stream"

### Live Control

- Video preview (or "Live" badge)
- Viewer count
- Destinations status (green = live)
- "End Stream" button

### Engagement Dashboard

- Sermon selector dropdown
- Metrics cards: Response rate, Total responses
- Table: Members, responded?, score
- Export button

### Question Form (Member)

- Sermon title
- Questions as text inputs or textareas
- Submit button
- Thank you message

---

# Part 14: AWS Architecture

## 14.1 Lambda Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| broadcast-post-stream | EventBridge (stream ended) or webhook | Run AI pipeline, create sermon, generate questions |
| broadcast-podcast-publish | EventBridge (sermon completed) | Extract audio, upload S3, publish to Spotify/Apple |
| broadcast-push-send | Invoked by post-stream | Send push notifications to members |

## 14.2 S3 Buckets

- **broadcast-recordings** — Raw stream recordings
- **broadcast-podcast-audio** — Extracted MP3s for podcast
- **Broadcast structure:** org_id/stream_id/recording.mp4, org_id/sermon_id/episode.mp3

## 14.3 EventBridge Rules

- **Stream ended:** When broadcast_streams.ended_at set → invoke post-stream Lambda
- **Daily:** Refresh credits at period boundary

---

# Part 15: Implementation Phases

## Phase 1: Foundation (Weeks 1-2)

- Next.js scaffold, Supabase client, auth
- Migrations for all broadcast_* tables
- Auth gate, org selector
- Dashboard shell (empty)

## Phase 2: Streaming (Weeks 3-4)

- LiveKit room creation, ingest URL
- Stream list, stream detail
- End stream flow
- Basic egress to YouTube (manual config)

## Phase 3: AI Pipeline (Weeks 5-6)

- Transcript storage (manual or post-stream)
- STT integration (Deepgram)
- LLM question generation
- broadcast_questions, broadcast_sermons
- Credits tracking

## Phase 4: Engagement (Weeks 7-8)

- Question form for members
- Response collection
- Pastor engagement dashboard
- Member list, add member

## Phase 5: Push & Podcast (Weeks 9-10)

- Push token registration
- Send push when questions ready
- Audio extraction Lambda
- Podcast RSS, Spotify/Apple publish

## Phase 6: Billing & Polish (Weeks 11-12)

- Stripe checkout, portal
- Subscription gating
- Error handling, loading states
- Documentation

---

# Part 16: Environment Variables

```
# Supabase (same as Give)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LiveKit
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI
DEEPGRAM_API_KEY=
OPENAI_API_KEY=  # or ANTHROPIC_API_KEY

# AWS (for Lambda, S3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
BROADCAST_RECORDINGS_BUCKET=
BROADCAST_PODCAST_BUCKET=

# Push (FCM or OneSignal)
FIREBASE_SERVER_KEY=  # or ONESIGNAL_APP_ID, ONESIGNAL_API_KEY
```

---

# Summary for AI

Build a **new Next.js 15 app** (separate codebase) that implements the Church Broadcast Tool as specified above. Use the **same Supabase project** as Give. Create **only** the broadcast_* tables. Integrate **LiveKit** for streaming, **Deepgram/Whisper** for STT, **OpenAI/Anthropic** for question generation, **Stripe** for subscriptions, and **AWS** for background jobs and storage. Ensure users log in once and access both Give and Broadcast with the same account.
