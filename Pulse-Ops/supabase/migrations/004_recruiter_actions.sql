-- ============================================================
-- 004_recruiter_actions.sql
-- Shortlists and recruiter-side contact unlock flow
-- ============================================================

-- ── Shortlists ────────────────────────────────────────────────
-- When a recruiter acts on a candidate (shortlist, unlock, pass)
create table shortlists (
  id               uuid        primary key default gen_random_uuid(),
  recruiter_id     uuid        not null references recruiters(id) on delete cascade,
  organization_id  uuid        not null references organizations(id) on delete cascade,
  user_id          uuid        not null references users(id) on delete restrict,
  job_id           uuid        references jobs(id) on delete set null,
  -- Contact unlock (costs 1 org credit)
  contact_unlocked boolean     not null default false,
  unlocked_at      timestamptz,
  -- Recruiter decision
  status           text        not null default 'shortlisted'
                               check (status in ('shortlisted', 'passed', 'hired')),
  status_changed_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),

  -- One recruiter can only shortlist a candidate for a given job once
  unique (recruiter_id, user_id, job_id)
);

-- ── Credit Ledger (immutable record of credit usage) ─────────
-- Deducted on unlock; never deleted so billing disputes can be audited
create table credit_transactions (
  id              bigserial   primary key,
  organization_id uuid        not null references organizations(id),
  recruiter_id    uuid        not null references recruiters(id),
  shortlist_id    uuid        references shortlists(id) on delete set null,
  delta           int         not null,    -- negative = deduction, positive = top-up
  reason          text        not null,    -- 'contact_unlock', 'plan_purchase', 'refund'
  created_at      timestamptz not null default now()
);

-- ── Recruiter Job Schemas ─────────────────────────────────────
-- Recruiters post roles they want to hire for (feeds the matching pipeline)
create table recruiter_jobs (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references organizations(id) on delete cascade,
  recruiter_id    uuid        not null references recruiters(id) on delete cascade,
  title           text        not null,
  description     text,
  required_skills text[]      not null default '{}',
  min_score       smallint    not null default 70,
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Candidate Notifications ───────────────────────────────────
-- When a recruiter shortlists/unlocks, notify the candidate in-app
create table notifications (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references users(id) on delete cascade,
  type          text        not null
                            check (type in (
                              'shortlisted',      -- recruiter added to shortlist
                              'mission_paused',   -- HITL required
                              'mission_submitted', -- application deployed
                              'mission_rejected', -- user rejected the mission
                              'pulse_computed'    -- nightly score refresh done
                            )),
  payload       jsonb       not null default '{}',
  read          boolean     not null default false,
  created_at    timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index idx_shortlists_org_user   on shortlists (organization_id, user_id);
create index idx_shortlists_recruiter  on shortlists (recruiter_id);
create index idx_shortlists_status     on shortlists (status);
create index idx_recruiter_jobs_org    on recruiter_jobs (organization_id);
create index idx_recruiter_jobs_skills on recruiter_jobs using gin (required_skills);
create index idx_notifications_user    on notifications (user_id, read, created_at desc);
create index idx_credit_tx_org         on credit_transactions (organization_id, created_at desc);

create trigger recruiter_jobs_updated_at
  before update on recruiter_jobs
  for each row execute function set_updated_at();
