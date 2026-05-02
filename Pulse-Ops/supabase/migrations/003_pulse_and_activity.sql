-- ============================================================
-- 003_pulse_and_activity.sql
-- Pulse Score and raw engineering activity entries
-- ============================================================

-- ── Pulse Entries (raw activity, append-only) ────────────────
-- One row per discrete engineering event (commit, PR, LC solve, schema change)
create table pulse_entries (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references users(id) on delete cascade,
  platform      text        not null
                            check (platform in ('github', 'leetcode', 'supabase', 'linkedin')),
  entry_type    text        not null,
  -- e.g. 'commit', 'pull_request', 'solved_problem', 'schema_migration', 'blog_post'
  raw_metric    text        not null,   -- "PR #402 merged — automated ETL pipeline"
  proof_url     text,                   -- link shown in recruiter audit view
  impact_score  smallint    check (impact_score between 0 and 10),
  -- Skill tags derived by impact_scorer agent: ['FastAPI', 'PostgreSQL']
  tags          text[]      not null default '{}',
  occurred_at   timestamptz not null,   -- when the actual activity happened
  ingested_at   timestamptz not null default now()
);

-- ── Pulse Scores (computed aggregate, one row per user) ───────
-- Refreshed nightly by the scheduler or on-demand after sync
create table pulse_scores (
  user_id       uuid        primary key references users(id) on delete cascade,
  total         smallint    not null default 0 check (total between 0 and 100),
  recency       smallint    not null default 0 check (recency between 0 and 40),
  diversity     smallint    not null default 0 check (diversity between 0 and 30),
  consistency   smallint    not null default 0 check (consistency between 0 and 30),
  -- Weekly sparkline: last 7 daily scores for the sparkline chart
  sparkline     smallint[]  not null default '{}',
  -- Skill confidence map: {FastAPI: 95, PostgreSQL: 88, ...}
  skill_scores  jsonb       not null default '{}',
  -- Most impactful entries (used for recruiter audit view)
  top_entry_ids uuid[]      not null default '{}',
  computed_at   timestamptz not null default now()
);

-- ── Ingestion Run Log (one row per nightly/on-demand run) ────
create table ingestion_runs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references users(id) on delete cascade,
  platform    text        not null,
  status      text        not null default 'running'
                          check (status in ('running', 'completed', 'failed')),
  entries_new int         not null default 0,
  error_msg   text,
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);

-- ── Mission Logs (append-only stream, powers the terminal UI) ─
-- This is what the frontend terminal widget subscribes to via Realtime.
create table mission_logs (
  id          bigserial   primary key,      -- bigserial: ordered, never gaps, cheap inserts
  mission_id  uuid        not null references missions(id) on delete cascade,
  user_id     uuid        not null references users(id) on delete cascade,
  log_level   text        not null default 'info'
                          check (log_level in ('info', 'warn', 'error', 'success')),
  message     text        not null,
  metadata    jsonb,                         -- optional structured payload
  created_at  timestamptz not null default now()
);
-- NOTE: mission_logs is intentionally not given an updated_at trigger —
-- it is append-only by design. Never UPDATE or DELETE rows here.

-- ── Indexes ──────────────────────────────────────────────────
-- Match candidates by skill for recruiter queries
create index idx_pulse_entries_user_id    on pulse_entries (user_id);
create index idx_pulse_entries_tags       on pulse_entries using gin (tags);
create index idx_pulse_entries_platform   on pulse_entries (user_id, platform);
-- For sparkline / recency scoring: latest entries first per user
create index idx_pulse_entries_occurred   on pulse_entries (user_id, occurred_at desc);

-- skill_scores GIN index for recruiter skill search
create index idx_pulse_scores_skills      on pulse_scores using gin (skill_scores);
create index idx_pulse_scores_total       on pulse_scores (total desc);

-- Terminal widget subscription: fetch all logs for a mission ordered by time
create index idx_mission_logs_mission_id  on mission_logs (mission_id, id asc);
create index idx_mission_logs_user_id     on mission_logs (user_id, created_at desc);
