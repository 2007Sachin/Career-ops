-- ============================================================
-- 001_core_tables.sql
-- Core user, org, and recruiter tables
-- ============================================================

-- ── Organizations (recruiter companies) ─────────────────────
create table organizations (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  domain           text        unique,          -- e.g. "acme.com" for auto-matching on recruiter signup
  tier             text        not null default 'free'
                               check (tier in ('free', 'growth', 'enterprise')),
  unlock_credits   int         not null default 10,   -- each shortlist+unlock costs 1 credit
  created_at       timestamptz not null default now()
);

-- ── Users (candidates / job-seekers) ────────────────────────
-- id is the Supabase Auth UID, enforcing 1:1 with auth.users
create table users (
  id                   uuid        primary key references auth.users(id) on delete cascade,
  email                text        not null unique,
  full_name            text,
  current_role         text,
  years_exp            smallint    check (years_exp between 0 and 60),
  location_preference  text,
  target_roles         text[]      not null default '{}',
  target_domains       text[]      not null default '{}',
  min_salary_usd       int         check (min_salary_usd >= 0),
  -- Platform connections: {github:{username}, leetcode:{username}, supabase:{url}, linkedin:{url}}
  connected_platforms  jsonb       not null default '{}',
  -- [{company, role, duration, skills:[], project_description}]
  internships          jsonb       not null default '[]',
  onboarded            boolean     not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── Recruiters ───────────────────────────────────────────────
create table recruiters (
  id              uuid        primary key references auth.users(id) on delete cascade,
  organization_id uuid        not null references organizations(id) on delete restrict,
  email           text        not null unique,
  display_name    text,
  role            text        not null default 'member' check (role in ('admin', 'member')),
  created_at      timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────
-- Fast lookup: "which users target this domain?"
create index idx_users_target_domains on users using gin (target_domains);
create index idx_users_target_roles   on users using gin (target_roles);
create index idx_users_onboarded      on users (onboarded) where onboarded = true;
create index idx_recruiters_org       on recruiters (organization_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on users
  for each row execute function set_updated_at();
