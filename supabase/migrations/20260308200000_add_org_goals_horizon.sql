-- Add horizon to org_goals: 90-day, 1-year, 3-year
alter table org_goals
  add column if not exists horizon text not null default '90_day'
  check (horizon in ('90_day', '1_year', '3_year'));

create index if not exists idx_org_goals_horizon on org_goals(horizon);

comment on column org_goals.horizon is 'Goal timeframe: 90_day, 1_year, or 3_year';
