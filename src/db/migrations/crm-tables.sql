-- =============================================================================
-- CRM TABLES MIGRATION
-- Run this in your Supabase SQL editor or via supabase db push.
-- All tables are scoped to organization_id for multi-tenant isolation.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CRM Tags  (custom labels, org-scoped)
-- ---------------------------------------------------------------------------
create table if not exists crm_tags (
  id          uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name        text not null,
  color       text not null default '#6366f1',  -- tailwind-compatible hex
  created_at  timestamptz not null default now(),
  unique (organization_id, name)
);

-- ---------------------------------------------------------------------------
-- 2. Contact–Tag assignments  (many-to-many)
-- ---------------------------------------------------------------------------
create table if not exists crm_contact_tags (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references organization_contacts(id) on delete cascade,
  tag_id      uuid not null references crm_tags(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (contact_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- 3. Contact Notes  (admin-written notes per contact)
-- ---------------------------------------------------------------------------
create table if not exists crm_contact_notes (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references organization_contacts(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  author_user_id  uuid references user_profiles(id),
  content         text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. CRM Messages  (individual messages sent to a specific contact)
-- ---------------------------------------------------------------------------
create table if not exists crm_messages (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references organization_contacts(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  sent_by_user_id uuid references user_profiles(id),
  channel         text not null check (channel in ('email', 'sms')),
  subject         text,               -- email subject; null for sms
  body            text not null,
  status          text not null default 'sent'
                  check (status in ('sent', 'delivered', 'failed', 'pending')),
  external_id     text,               -- Resend message ID or Twilio SID
  sent_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. CRM Broadcasts  (mass sends to a filtered segment)
-- ---------------------------------------------------------------------------
create table if not exists crm_broadcasts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sent_by_user_id uuid references user_profiles(id),
  channel         text not null check (channel in ('email', 'sms')),
  subject         text,
  body            text not null,
  filter_tags     uuid[],             -- tag IDs to filter by; null = all contacts
  filter_source   text,               -- source filter (donation/form/survey/manual); null = all
  recipient_count int not null default 0,
  sent_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. Broadcast Recipients  (per-contact delivery record for a broadcast)
-- ---------------------------------------------------------------------------
create table if not exists crm_broadcast_recipients (
  id           uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references crm_broadcasts(id) on delete cascade,
  contact_id   uuid not null references organization_contacts(id) on delete cascade,
  status       text not null default 'sent'
               check (status in ('sent', 'delivered', 'failed', 'skipped')),
  unique (broadcast_id, contact_id)
);

-- ---------------------------------------------------------------------------
-- 7. Survey Assignments  (track survey → specific contact sends)
-- ---------------------------------------------------------------------------
create table if not exists crm_survey_assignments (
  id              uuid primary key default gen_random_uuid(),
  survey_id       uuid not null references organization_surveys(id) on delete cascade,
  contact_id      uuid not null references organization_contacts(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  assigned_by     uuid references user_profiles(id),
  channel         text not null default 'email' check (channel in ('email', 'sms')),
  assigned_at     timestamptz not null default now(),
  sent_at         timestamptz,
  responded_at    timestamptz,
  unique (survey_id, contact_id)
);

-- ---------------------------------------------------------------------------
-- 8. Activity Log  (immutable timeline for each contact)
-- ---------------------------------------------------------------------------
create table if not exists crm_activity_log (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references organization_contacts(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  -- event_type values: contact_created | note_added | note_edited | tag_added | tag_removed
  --                    message_sent | broadcast_received | survey_sent | survey_responded
  event_type      text not null,
  event_data      jsonb not null default '{}',
  created_at      timestamptz not null default now()
);
create index if not exists crm_activity_log_contact_idx on crm_activity_log(contact_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security (allow org admins to read/write their own data)
-- ---------------------------------------------------------------------------
alter table crm_tags                enable row level security;
alter table crm_contact_tags        enable row level security;
alter table crm_contact_notes       enable row level security;
alter table crm_messages            enable row level security;
alter table crm_broadcasts          enable row level security;
alter table crm_broadcast_recipients enable row level security;
alter table crm_survey_assignments  enable row level security;
alter table crm_activity_log        enable row level security;

-- Helper: get the caller's organization_id from user_profiles
-- (Assumes Supabase auth.uid() maps to user_profiles.id)

-- crm_tags
create policy "org members can manage their tags"
  on crm_tags for all
  using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
      union
      select preferred_organization_id from user_profiles where id = auth.uid()
    )
  );

-- crm_contact_tags (via contact's organization)
create policy "org members can manage contact tags"
  on crm_contact_tags for all
  using (
    contact_id in (
      select id from organization_contacts
      where organization_id in (
        select organization_id from user_profiles where id = auth.uid()
        union
        select preferred_organization_id from user_profiles where id = auth.uid()
      )
    )
  );

-- crm_contact_notes
create policy "org members can manage contact notes"
  on crm_contact_notes for all
  using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
      union
      select preferred_organization_id from user_profiles where id = auth.uid()
    )
  );

-- crm_messages
create policy "org members can manage messages"
  on crm_messages for all
  using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
      union
      select preferred_organization_id from user_profiles where id = auth.uid()
    )
  );

-- crm_broadcasts
create policy "org members can manage broadcasts"
  on crm_broadcasts for all
  using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
      union
      select preferred_organization_id from user_profiles where id = auth.uid()
    )
  );

-- crm_broadcast_recipients (via broadcast's organization)
create policy "org members can view broadcast recipients"
  on crm_broadcast_recipients for all
  using (
    broadcast_id in (
      select id from crm_broadcasts
      where organization_id in (
        select organization_id from user_profiles where id = auth.uid()
        union
        select preferred_organization_id from user_profiles where id = auth.uid()
      )
    )
  );

-- crm_survey_assignments
create policy "org members can manage survey assignments"
  on crm_survey_assignments for all
  using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
      union
      select preferred_organization_id from user_profiles where id = auth.uid()
    )
  );

-- crm_activity_log
create policy "org members can view activity log"
  on crm_activity_log for all
  using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
      union
      select preferred_organization_id from user_profiles where id = auth.uid()
    )
  );
