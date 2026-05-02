-- ============================================================
-- 002_jobs_and_missions.sql
-- Job listings and the mission pipeline
-- ============================================================

-- ── Jobs (scouted or uploaded opportunities) ─────────────────
create table jobs (
  id                uuid        primary key default gen_random_uuid(),
  title             text        not null,
  company           text        not null,
  domain            text,                            -- "FinTech", "AI/ML", etc.
  salary_min_usd    int,
  salary_max_usd    int,
  salary_raw        text,                            -- raw string: "$180k - $210k" or "Equity"
  description       text,
  hard_requirements text[]      not null default '{}',
  soft_requirements text[]      not null default '{}',
  skills_required   text[]      not null default '{}', -- for GIN index matching
  apply_url         text,
  ats_type          text        check (ats_type in ('greenhouse', 'lever', 'workday', 'ashby', 'custom')),
  source            text        not null default 'scout_agent'
                                check (source in ('scout_agent', 'recruiter_upload', 'manual')),
  posted_at         timestamptz,
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now()
);

-- ── Missions (one per user × job pair) ───────────────────────
-- A mission is the full lifecycle: scouting → tailoring → HITL → submitted
create table missions (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references users(id) on delete cascade,
  job_id          uuid        not null references jobs(id) on delete restrict,
  status          text        not null default 'scouting'
                              check (status in (
                                'scouting',
                                'tailoring',
                                'awaiting_approval',   -- HITL pause
                                'resuming',            -- agent restarted after HITL
                                'submitted',
                                'rejected',            -- user rejected the mission
                                'withdrawn'            -- application withdrawn after submit
                              )),
  match_score     smallint    check (match_score between 0 and 100),
  -- Tailor agent output
  narrative_text  text,
  -- [{text, chip_label, pulse_entry_id, impact_weight}]
  narrative_chips jsonb       not null default '[]',
  applied_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (user_id, job_id)
);

-- ── HITL questions (one set per mission, created by outreach agent) ──
create table hitl_questions (
  id            uuid        primary key default gen_random_uuid(),
  mission_id    uuid        not null references missions(id) on delete cascade,
  field_label   text        not null,   -- "Describe your EV infrastructure experience"
  field_type    text        not null default 'textarea'
                            check (field_type in ('text', 'textarea', 'select', 'number', 'date')),
  ats_field_key text,                   -- the ATS field name the agent couldn't map
  display_order smallint    not null default 0,
  created_at    timestamptz not null default now()
);

-- ── HITL responses (user answers) ────────────────────────────
create table hitl_responses (
  id            uuid        primary key default gen_random_uuid(),
  question_id   uuid        not null references hitl_questions(id) on delete cascade,
  mission_id    uuid        not null references missions(id) on delete cascade,
  user_id       uuid        not null references users(id) on delete cascade,
  response_text text,
  submitted_at  timestamptz not null default now(),

  unique (question_id, mission_id)  -- one answer per question per mission
);

-- ── Indexes ──────────────────────────────────────────────────
create index idx_jobs_skills_required on jobs using gin (skills_required);
create index idx_jobs_domain          on jobs (domain);
create index idx_jobs_is_active       on jobs (is_active) where is_active = true;

create index idx_missions_user_id     on missions (user_id);
create index idx_missions_job_id      on missions (job_id);
create index idx_missions_status      on missions (status);
-- Fast HITL dashboard query: all missions needing approval for a user
create index idx_missions_hitl        on missions (user_id, status)
  where status = 'awaiting_approval';

create index idx_hitl_q_mission       on hitl_questions (mission_id);
create index idx_hitl_r_mission       on hitl_responses (mission_id);

create trigger missions_updated_at
  before update on missions
  for each row execute function set_updated_at();
