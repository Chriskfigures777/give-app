-- =============================================================================
-- BUDGET TABLES MIGRATION
-- Supports personal budgets (user-scoped) and church/org budgets (org-scoped).
-- Each budget is broken into sheets (monthly periods), income rows,
-- fixed expense rows, variable expense rows, and a transaction log.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Budget Sheets  (one per month/period, owned by a user or org)
-- ---------------------------------------------------------------------------
create table if not exists budget_sheets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references user_profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  budget_type     text not null default 'personal'
                  check (budget_type in ('personal', 'church')),
  name            text not null,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  budget_sheets              is 'Monthly or periodic budget sheet. Personal (user_id scoped) or church/org (organization_id scoped).';
comment on column budget_sheets.budget_type  is 'personal = individual budget; church = organization-wide budget';
comment on column budget_sheets.name         is 'Human-readable label, e.g. "March 2026"';

-- ---------------------------------------------------------------------------
-- 2. Budget Income Rows
-- ---------------------------------------------------------------------------
create table if not exists budget_income_rows (
  id          uuid primary key default gen_random_uuid(),
  sheet_id    uuid not null references budget_sheets(id) on delete cascade,
  sort_order  integer not null default 0,
  category    text not null default '',
  budgeted    numeric(12,2),
  actual      numeric(12,2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table budget_income_rows is 'Individual income line items for a budget sheet.';

-- ---------------------------------------------------------------------------
-- 3. Budget Fixed Expense Rows
-- ---------------------------------------------------------------------------
create table if not exists budget_fixed_expense_rows (
  id            uuid primary key default gen_random_uuid(),
  sheet_id      uuid not null references budget_sheets(id) on delete cascade,
  sort_order    integer not null default 0,
  item          text not null default '',
  budget_amt    numeric(12,2),
  paid_to_date  numeric(12,2),
  due_date      text not null default '—',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table budget_fixed_expense_rows is 'Fixed monthly expense line items (rent, insurance, subscriptions, etc.).';

-- ---------------------------------------------------------------------------
-- 4. Budget Variable Expense Rows
-- ---------------------------------------------------------------------------
create table if not exists budget_variable_expense_rows (
  id            uuid primary key default gen_random_uuid(),
  sheet_id      uuid not null references budget_sheets(id) on delete cascade,
  sort_order    integer not null default 0,
  item          text not null default '',
  budget_amt    numeric(12,2),
  paid_to_date  numeric(12,2),
  due_date      text not null default '—',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table budget_variable_expense_rows is 'Variable monthly expense line items (groceries, gas, fun money, etc.).';

-- ---------------------------------------------------------------------------
-- 5. Budget Transactions
-- ---------------------------------------------------------------------------
create table if not exists budget_transactions (
  id          uuid primary key default gen_random_uuid(),
  sheet_id    uuid not null references budget_sheets(id) on delete cascade,
  sort_order  integer not null default 0,
  txn_date    date,
  description text not null default '',
  category    text not null default '',
  amount      numeric(12,2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table budget_transactions is 'Individual transaction log entries linked to a budget sheet. Positive = income, negative = expense.';

-- ---------------------------------------------------------------------------
-- 6. Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_budget_sheets_user_id         on budget_sheets(user_id);
create index if not exists idx_budget_sheets_org_id          on budget_sheets(organization_id);
create index if not exists idx_budget_income_rows_sheet_id   on budget_income_rows(sheet_id);
create index if not exists idx_budget_fixed_rows_sheet_id    on budget_fixed_expense_rows(sheet_id);
create index if not exists idx_budget_variable_rows_sheet_id on budget_variable_expense_rows(sheet_id);
create index if not exists idx_budget_transactions_sheet_id  on budget_transactions(sheet_id);
create index if not exists idx_budget_transactions_date      on budget_transactions(txn_date);

-- ---------------------------------------------------------------------------
-- 7. updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function update_budget_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_budget_sheets_updated_at
  before update on budget_sheets
  for each row execute function update_budget_updated_at();

create or replace trigger trg_budget_income_rows_updated_at
  before update on budget_income_rows
  for each row execute function update_budget_updated_at();

create or replace trigger trg_budget_fixed_rows_updated_at
  before update on budget_fixed_expense_rows
  for each row execute function update_budget_updated_at();

create or replace trigger trg_budget_variable_rows_updated_at
  before update on budget_variable_expense_rows
  for each row execute function update_budget_updated_at();

create or replace trigger trg_budget_transactions_updated_at
  before update on budget_transactions
  for each row execute function update_budget_updated_at();

-- ---------------------------------------------------------------------------
-- 8. Row-Level Security
-- ---------------------------------------------------------------------------
alter table budget_sheets              enable row level security;
alter table budget_income_rows         enable row level security;
alter table budget_fixed_expense_rows  enable row level security;
alter table budget_variable_expense_rows enable row level security;
alter table budget_transactions        enable row level security;

-- ── budget_sheets ──────────────────────────────────────────────────────────

-- Personal budget: only the owner sees it
create policy "budget_sheets_personal_select"
  on budget_sheets for select
  using (
    budget_type = 'personal' and user_id = auth.uid()
  );

-- Church budget: org admin/owner sees it
create policy "budget_sheets_church_select"
  on budget_sheets for select
  using (
    budget_type = 'church'
    and organization_id in (
      select id from organizations where owner_user_id = auth.uid()
      union
      select organization_id from user_profiles where id = auth.uid() and organization_id is not null
    )
  );

-- Insert: authenticated user can create sheets for themselves
create policy "budget_sheets_insert"
  on budget_sheets for insert
  with check (user_id = auth.uid());

-- Update: same as select — owner or org admin
create policy "budget_sheets_update"
  on budget_sheets for update
  using (
    user_id = auth.uid()
    or (
      budget_type = 'church'
      and organization_id in (
        select id from organizations where owner_user_id = auth.uid()
        union
        select organization_id from user_profiles where id = auth.uid() and organization_id is not null
      )
    )
  );

-- Delete: owner or org admin
create policy "budget_sheets_delete"
  on budget_sheets for delete
  using (
    user_id = auth.uid()
    or (
      budget_type = 'church'
      and organization_id in (
        select id from organizations where owner_user_id = auth.uid()
      )
    )
  );

-- ── Child rows (income, fixed, variable, transactions) ────────────────────
-- Access is granted via the parent sheet's access policies using EXISTS.

-- budget_income_rows
create policy "budget_income_rows_all"
  on budget_income_rows for all
  using (
    exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id
        and (
          bs.user_id = auth.uid()
          or (
            bs.budget_type = 'church'
            and bs.organization_id in (
              select id from organizations where owner_user_id = auth.uid()
              union
              select organization_id from user_profiles where id = auth.uid() and organization_id is not null
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id and bs.user_id = auth.uid()
    )
    or exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id
        and bs.budget_type = 'church'
        and bs.organization_id in (
          select id from organizations where owner_user_id = auth.uid()
          union
          select organization_id from user_profiles where id = auth.uid() and organization_id is not null
        )
    )
  );

-- budget_fixed_expense_rows
create policy "budget_fixed_rows_all"
  on budget_fixed_expense_rows for all
  using (
    exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id
        and (
          bs.user_id = auth.uid()
          or (
            bs.budget_type = 'church'
            and bs.organization_id in (
              select id from organizations where owner_user_id = auth.uid()
              union
              select organization_id from user_profiles where id = auth.uid() and organization_id is not null
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id and bs.user_id = auth.uid()
    )
    or exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id
        and bs.budget_type = 'church'
        and bs.organization_id in (
          select id from organizations where owner_user_id = auth.uid()
          union
          select organization_id from user_profiles where id = auth.uid() and organization_id is not null
        )
    )
  );

-- budget_variable_expense_rows
create policy "budget_variable_rows_all"
  on budget_variable_expense_rows for all
  using (
    exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id
        and (
          bs.user_id = auth.uid()
          or (
            bs.budget_type = 'church'
            and bs.organization_id in (
              select id from organizations where owner_user_id = auth.uid()
              union
              select organization_id from user_profiles where id = auth.uid() and organization_id is not null
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id and bs.user_id = auth.uid()
    )
    or exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id
        and bs.budget_type = 'church'
        and bs.organization_id in (
          select id from organizations where owner_user_id = auth.uid()
          union
          select organization_id from user_profiles where id = auth.uid() and organization_id is not null
        )
    )
  );

-- budget_transactions
create policy "budget_transactions_all"
  on budget_transactions for all
  using (
    exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id
        and (
          bs.user_id = auth.uid()
          or (
            bs.budget_type = 'church'
            and bs.organization_id in (
              select id from organizations where owner_user_id = auth.uid()
              union
              select organization_id from user_profiles where id = auth.uid() and organization_id is not null
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id and bs.user_id = auth.uid()
    )
    or exists (
      select 1 from budget_sheets bs
      where bs.id = sheet_id
        and bs.budget_type = 'church'
        and bs.organization_id in (
          select id from organizations where owner_user_id = auth.uid()
          union
          select organization_id from user_profiles where id = auth.uid() and organization_id is not null
        )
    )
  );
