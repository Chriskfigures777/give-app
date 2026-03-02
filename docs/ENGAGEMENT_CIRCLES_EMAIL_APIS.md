# Engagement Circles, Email Management & APIs — Introduction

This document introduces the features and APIs needed to build **engagement circles** (partnership circles), **congregation/member management**, **email campaigns**, and **in-app messaging** for churches on the Give platform.

See [CHURCH_MISSIONARY_NONPROFIT_MODEL.md](CHURCH_MISSIONARY_NONPROFIT_MODEL.md) for the overall church/missionary/nonprofit model.

---

## 1. Engagement Circles (Partnership Circles)

**Concept:** Groups of supporters around a missionary or cause. Church can see who supports which missionary; donors can be in multiple circles.

| Feature | Description |
|---------|-------------|
| **Circle** | Named group (e.g. "Missionary Sarah Supporters", "Youth Mission Trip") |
| **Members** | Donors who have given to that missionary/cause, or church manually adds |
| **Church view** | See all circles, who's in each, total support |
| **Donor view** | See which circles I'm in (if member) |

### Data Model

- **`engagement_circles`** — org_id, name, missionary_id (optional), created_at
- **`engagement_circle_members`** — circle_id, user_id or donor_email, status (pending/approved), added_by, created_at

---

## 2. Congregation / Member Management

**Flow:**

- **Donor** gives to church → can request to become a **member**
- **Church** approves or manually adds members
- **Members** can log in, see their giving, receive church emails/messages

| Status | Description |
|--------|-------------|
| Donor | Gave once; no login required |
| Member (pending) | Requested membership; awaiting church approval |
| Member (approved) | Church approved; can log in |
| Member (manual) | Church added without donation |

### Data Model

- **`church_members`** or **`congregation_members`** — organization_id, user_id, email, status, approved_at, approved_by, created_at
- Reuse `user_profiles` for login; members sign in with Supabase Auth

---

## 3. Email Management — Tools & APIs

**Use cases:**

- Transactional: receipts, confirmations (already have Resend)
- Congregation emails: newsletters, announcements, campaigns
- Church sends from church name (e.g. `pastor@church.org`)

### Tool Comparison

| Tool | Best for | API | Pricing |
|------|----------|-----|---------|
| **Resend** | Transactional (already integrated) | [Resend API](https://resend.com/docs/api-reference) | Free 100/day, Pro $20/mo |
| **Resend Broadcasts** | Marketing campaigns, newsletters | [Broadcast API](https://resend.com/docs/api-reference/broadcasts) | Same account as Resend |
| **Brevo** | Full CRM + email + automation | [Brevo API](https://developers.brevo.com/) | Free 300/day, paid plans |
| **Postmark** | Transactional (high deliverability) | [Postmark API](https://postmarkapp.com/developer) | $15/mo 10K |
| **SendGrid** | Scale, marketing + transactional | [SendGrid API](https://docs.sendgrid.com/) | $20/mo 100K |

### Recommendation for Give

- **Transactional:** Keep Resend (already in [src/lib/email/resend.ts](../src/lib/email/resend.ts))
- **Congregation campaigns:** Resend Broadcasts (same vendor, one API key) or Brevo (if you need lists, segments, automation)
- **Church sends from own domain:** Resend supports custom "from" per org; verify domain per church or use subdomain (e.g. `mail.give.app` with Reply-To church email)

---

## 4. In-App Messaging

**Current state:** [src/app/api/chat/threads/route.ts](../src/app/api/chat/threads/route.ts) — org-to-org and user-to-org chat via `peer_connections` + `chat_threads`.

**Expand for congregation:**

- **Church → Member:** Church sends message to member (or circle); member sees in app
- **Broadcast to circle:** Church sends one message to all members of a circle

### Implementation Options

| Approach | Pros | Cons |
|----------|------|------|
| **Extend existing chat** | Reuse `chat_threads`; add "broadcast" thread type | Need to model 1-to-many |
| **New `church_messages` table** | Simple: church_id, recipient_ids or circle_id, content | Separate from peer chat |
| **Supabase Realtime** | Already used; push to connected clients | Need presence/subscription per user |

**API:** Supabase (already have). Add `church_messages` or extend `chat_threads` with `thread_type: 'direct' | 'broadcast'`.

---

## 5. APIs to Connect — Summary

| Capability | API / Service | What to add |
|------------|---------------|-------------|
| **Transactional email** | Resend | Already have |
| **Congregation campaigns** | Resend Broadcasts or Brevo | New: Broadcast API or Brevo contacts/campaigns |
| **Member management** | Supabase | New tables: `church_members`, `engagement_circles`, `engagement_circle_members` |
| **In-app messaging** | Supabase + Realtime | Extend chat or add `church_messages` |
| **Church custom domain email** | Resend domains | Verify domain per church; use as "from" |

### Environment Variables

**If using Resend Broadcasts (recommended):**

- `RESEND_API_KEY` — already have; Broadcasts use same key
- `RESEND_FROM_EMAIL` — already have

**If using Brevo for campaigns:**

- `BREVO_API_KEY`
- Brevo contacts API for list management

---

## 6. Implementation Order

1. **Member management** — `church_members` table, approval flow, donor → member request
2. **Engagement circles** — `engagement_circles`, `engagement_circle_members`, church dashboard UI
3. **In-app messaging** — Church → member, Church → circle broadcast
4. **Email campaigns** — Resend Broadcasts or Brevo; church selects list (circle or all members), sends campaign

---

## API Documentation Links

- [Resend API Reference](https://resend.com/docs/api-reference)
- [Resend Broadcasts API](https://resend.com/docs/api-reference/broadcasts)
- [Brevo API](https://developers.brevo.com/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
