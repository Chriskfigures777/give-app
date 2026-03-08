# Email outreach (broadcast, reminders, surveys)

## Provider

- **Bulk/list email:** Use **SendGrid** for bulk and list email (event reminders, broadcast to members, survey links, Get Started link). If SMS is required early, consider **Twilio** for both SMS and email.
- **Transactional:** Resend is used for form forwarding, auto-reply, and other transactional mail. It can remain in place; bulk flows can later be consolidated with SendGrid.

## Send-from domain

- **v1:** All outbound email (event reminders, broadcast, survey invites, Get Started link) is sent **from the platform domain** (e.g. `notifications@give.app` or your configured `RESEND_FROM_EMAIL`), not the church’s or nonprofit’s own domain.
- **Benefits:** No per-org domain verification or DNS (SPF, DKIM); one sending domain to warm and maintain.
- **UI:** Copy in the dashboard states that messages are “sent via the platform” so orgs know recipients see the message as coming from their organization through the platform.
- **Later:** “Send from your organization’s domain” can be a premium or configurable feature (org adds domain, platform guides DNS, provider sends on their behalf).

## Features using email

- **Event reminders:** Cron job sends 1-week and 1-day reminders to contacts (Resend); idempotency via `event_reminder_sends`.
- **Broadcast:** “Send message” sends to all contacts with email (excluding unsubscribed); stored in `broadcast_log`; unsubscribe link included.
- **Survey link:** “Send link to contacts” emails the survey URL to contacts (same as broadcast, fixed body).
- **Get Started link:** The public Get Started form URL can be shared; “send to list” (e.g. via SendGrid/Twilio) will use the same URL in a future phase.
