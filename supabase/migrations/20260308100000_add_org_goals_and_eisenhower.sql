-- =============================================================================
-- ORG GOALS (90-day rocks / SMART goals) and EISENHOWER WHITEBOARD
-- Scoped to organization_id for multi-tenant isolation.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Org goals (high-level containers: name, owner, access, end date, description)
-- Optional SMART: target_value, target_unit (e.g. members, dollars)
-- ---------------------------------------------------------------------------
create table if not exists org_goals (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  name              text not null,
  description       text,
  owner_user_ids    uuid[] default '{}',  -- who is responsible (optional)
  access            text not null default 'workspace' check (access in ('workspace', 'private')),
  start_date        date,
  end_date          date,
  target_value      numeric,               -- e.g. 100 (members), 50000 (dollars)
  target_unit       text,                  -- e.g. 'members', 'dollars', 'custom'
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_org_goals_organization_id on org_goals(organization_id);
create index if not exists idx_org_goals_end_date on org_goals(end_date);

-- ---------------------------------------------------------------------------
-- 2. Goal progress updates (weekly or ad-hoc: current value, note)
-- ---------------------------------------------------------------------------
create table if not exists org_goal_updates (
  id           uuid primary key default gen_random_uuid(),
  goal_id      uuid not null references org_goals(id) on delete cascade,
  value_number numeric,          -- e.g. 10, 20 (current count/amount)
  value_text   text,             -- freeform if not numeric
  note         text,
  recorded_at  date not null default (current_date),
  created_at   timestamptz not null default now()
);

create index if not exists idx_org_goal_updates_goal_id on org_goal_updates(goal_id);
create index if not exists idx_org_goal_updates_recorded_at on org_goal_updates(recorded_at);

-- ---------------------------------------------------------------------------
-- 3. Eisenhower whiteboard items (quadrant sticky notes)
-- Quadrants: 1 = Urgent+Important, 2 = Not Urgent+Important,
--            3 = Urgent+Not Important, 4 = Not Urgent+Not Important
-- ---------------------------------------------------------------------------
create table if not exists eisenhower_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  quadrant        int not null check (quadrant >= 1 and quadrant <= 4),
  title           text not null default '',
  content         text,
  position_x      int not null default 0,
  position_y      int not null default 0,
  color           text not null default '#fef08a',  -- hex, e.g. yellow
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_eisenhower_items_organization_id on eisenhower_items(organization_id);

-- RLS (optional: enable when you use RLS for these tables)
-- alter table org_goals enable row level security;
-- alter table org_goal_updates enable row level security;
-- alter table eisenhower_items enable row level security;
