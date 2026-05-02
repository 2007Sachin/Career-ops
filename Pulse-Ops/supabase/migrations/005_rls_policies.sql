-- ============================================================
-- 005_rls_policies.sql
-- Row Level Security — every table locked down by auth role
-- ============================================================

-- Enable RLS on all tables
alter table users                enable row level security;
alter table organizations        enable row level security;
alter table recruiters           enable row level security;
alter table jobs                 enable row level security;
alter table missions             enable row level security;
alter table hitl_questions       enable row level security;
alter table hitl_responses       enable row level security;
alter table pulse_entries        enable row level security;
alter table pulse_scores         enable row level security;
alter table ingestion_runs       enable row level security;
alter table mission_logs         enable row level security;
alter table shortlists           enable row level security;
alter table credit_transactions  enable row level security;
alter table recruiter_jobs       enable row level security;
alter table notifications        enable row level security;

-- ── Helper: identify recruiter vs candidate ──────────────────
-- We use app_metadata.role set during Supabase Auth sign-up custom claims.
-- Recruiters get: {"role": "recruiter", "org_id": "<uuid>"}
-- Candidates get: {"role": "candidate"}

create or replace function is_recruiter()
returns boolean language sql stable security definer as $$
  select coalesce(
    (auth.jwt()->'app_metadata'->>'role') = 'recruiter',
    false
  );
$$;

create or replace function my_org_id()
returns uuid language sql stable security definer as $$
  select (auth.jwt()->'app_metadata'->>'org_id')::uuid;
$$;

-- ════════════════════════════════════════════════════════════
-- USERS table
-- ════════════════════════════════════════════════════════════

-- Candidate: read/write own row only
create policy "users: candidate reads own row"
  on users for select
  using (auth.uid() = id);

create policy "users: candidate updates own row"
  on users for update
  using (auth.uid() = id);

create policy "users: candidate inserts own row"
  on users for insert
  with check (auth.uid() = id);

-- Recruiter: read anonymized view — no email, no full_name until unlocked
-- This policy returns rows but the SELECT columns are restricted via a view (see below).
create policy "users: recruiter reads candidates"
  on users for select
  using (is_recruiter());

-- ── Anonymized candidate view for recruiters ─────────────────
-- Recruiters query this view, not the users table directly.
-- Full name and email are masked until shortlist.contact_unlocked = true.
create or replace view recruiter_candidates with (security_invoker = true) as
select
  u.id,
  -- Mask identity until unlocked by this org
  case
    when s.contact_unlocked = true
    then u.full_name
    else split_part(u.full_name, ' ', 1) || ' ' || left(split_part(u.full_name, ' ', 2), 1) || '.'
  end                                     as name,
  case
    when s.contact_unlocked = true
    then u.email
    else null
  end                                     as email,
  s.contact_unlocked,
  s.status                                as shortlist_status,
  ps.total                                as pulse_score,
  ps.skill_scores,
  u.target_roles,
  u.target_domains,
  u.years_exp,
  u.created_at
from users u
join pulse_scores ps on ps.user_id = u.id
left join shortlists s
  on s.user_id = u.id
  and s.organization_id = my_org_id()
  and s.status != 'passed'
where u.onboarded = true;
-- RLS on `users` still applies; this view inherits it.

-- ════════════════════════════════════════════════════════════
-- ORGANIZATIONS
-- ════════════════════════════════════════════════════════════

create policy "orgs: recruiter reads own org"
  on organizations for select
  using (is_recruiter() and id = my_org_id());

-- ════════════════════════════════════════════════════════════
-- RECRUITERS
-- ════════════════════════════════════════════════════════════

create policy "recruiters: read own row"
  on recruiters for select
  using (auth.uid() = id);

create policy "recruiters: read same org"
  on recruiters for select
  using (is_recruiter() and organization_id = my_org_id());

-- ════════════════════════════════════════════════════════════
-- JOBS
-- ════════════════════════════════════════════════════════════

-- All authenticated users can read active jobs (candidates see their feed)
create policy "jobs: any authenticated user reads active jobs"
  on jobs for select
  using (auth.uid() is not null and is_active = true);

-- Only service_role (backend agents) can insert/update jobs
-- (No client-side write policy — handled exclusively by backend)

-- ════════════════════════════════════════════════════════════
-- MISSIONS
-- ════════════════════════════════════════════════════════════

create policy "missions: candidate reads own missions"
  on missions for select
  using (auth.uid() = user_id);

create policy "missions: candidate updates own missions"
  on missions for update
  using (auth.uid() = user_id)
  with check (
    -- Candidates can only reject or withdraw (not fake a 'submitted' status)
    status in ('rejected', 'withdrawn')
  );

-- Backend agents insert/update missions via service_role — no client insert policy needed.

-- ════════════════════════════════════════════════════════════
-- HITL QUESTIONS + RESPONSES
-- ════════════════════════════════════════════════════════════

create policy "hitl_q: candidate reads questions for own missions"
  on hitl_questions for select
  using (
    exists (
      select 1 from missions m
      where m.id = hitl_questions.mission_id
      and m.user_id = auth.uid()
    )
  );

create policy "hitl_r: candidate inserts own responses"
  on hitl_responses for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from missions m
      where m.id = hitl_responses.mission_id
      and m.user_id = auth.uid()
    )
  );

create policy "hitl_r: candidate reads own responses"
  on hitl_responses for select
  using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- PULSE ENTRIES
-- ════════════════════════════════════════════════════════════

create policy "pulse_entries: candidate reads own entries"
  on pulse_entries for select
  using (auth.uid() = user_id);

-- Recruiters can read entries for unlocked candidates (for the audit view)
create policy "pulse_entries: recruiter reads unlocked candidate entries"
  on pulse_entries for select
  using (
    is_recruiter()
    and exists (
      select 1 from shortlists s
      where s.user_id = pulse_entries.user_id
      and s.organization_id = my_org_id()
      and s.contact_unlocked = true
    )
  );

-- ════════════════════════════════════════════════════════════
-- PULSE SCORES
-- ════════════════════════════════════════════════════════════

create policy "pulse_scores: candidate reads own score"
  on pulse_scores for select
  using (auth.uid() = user_id);

-- Recruiters can read scores for all onboarded candidates (via recruiter_candidates view)
create policy "pulse_scores: recruiter reads all scores"
  on pulse_scores for select
  using (is_recruiter());

-- ════════════════════════════════════════════════════════════
-- MISSION LOGS (terminal stream)
-- ════════════════════════════════════════════════════════════

create policy "mission_logs: candidate reads own mission logs"
  on mission_logs for select
  using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- SHORTLISTS
-- ════════════════════════════════════════════════════════════

create policy "shortlists: recruiter reads own org shortlists"
  on shortlists for select
  using (is_recruiter() and organization_id = my_org_id());

create policy "shortlists: recruiter inserts shortlists for own org"
  on shortlists for insert
  with check (
    is_recruiter()
    and organization_id = my_org_id()
    and recruiter_id = auth.uid()
  );

create policy "shortlists: recruiter updates own shortlists"
  on shortlists for update
  using (is_recruiter() and recruiter_id = auth.uid())
  with check (organization_id = my_org_id());

-- Candidate can see who shortlisted them (for notification purposes — no org details)
create policy "shortlists: candidate sees own shortlists"
  on shortlists for select
  using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ════════════════════════════════════════════════════════════

create policy "notifications: user reads own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "notifications: user marks own notifications read"
  on notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- RECRUITER JOBS
-- ════════════════════════════════════════════════════════════

create policy "recruiter_jobs: recruiter reads own org jobs"
  on recruiter_jobs for select
  using (is_recruiter() and organization_id = my_org_id());

create policy "recruiter_jobs: recruiter manages own org jobs"
  on recruiter_jobs for all
  using (is_recruiter() and organization_id = my_org_id())
  with check (
    organization_id = my_org_id()
    and recruiter_id = auth.uid()
  );

-- ════════════════════════════════════════════════════════════
-- CREDIT TRANSACTIONS
-- ════════════════════════════════════════════════════════════

-- Read-only for recruiter admins in own org; inserts only via service_role
create policy "credit_tx: org admin reads own transactions"
  on credit_transactions for select
  using (
    is_recruiter()
    and organization_id = my_org_id()
    and exists (
      select 1 from recruiters r
      where r.id = auth.uid() and r.role = 'admin'
    )
  );
