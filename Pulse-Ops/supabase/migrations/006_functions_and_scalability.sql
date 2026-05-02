-- ============================================================
-- 006_functions_and_scalability.sql
-- Atomic database functions, computed views, and performance config
-- ============================================================

-- ── Atomic unlock function ────────────────────────────────────
-- Runs inside a single transaction to prevent credit double-spend.
-- Called by the backend via rpc('unlock_candidate', {...}).
-- Using service_role so it bypasses RLS; access control is enforced
-- by validating recruiter_id matches the calling user's JWT in the backend.
create or replace function unlock_candidate(
  p_recruiter_id      uuid,
  p_organization_id   uuid,
  p_candidate_id      uuid,
  p_job_id            uuid default null
)
returns jsonb
language plpgsql
security definer  -- runs as the function owner (superuser), not the caller
as $$
declare
  v_credits       int;
  v_shortlist_id  uuid;
  v_email         text;
begin
  -- 1. Lock the org row to prevent concurrent unlocks draining credits
  select unlock_credits into v_credits
  from organizations
  where id = p_organization_id
  for update;                           -- row-level lock within this txn

  if v_credits < 1 then
    raise exception 'INSUFFICIENT_CREDITS'
      using hint = 'Purchase more unlock credits to continue';
  end if;

  -- 2. Upsert shortlist with unlock
  insert into shortlists (recruiter_id, organization_id, user_id, job_id, contact_unlocked, unlocked_at)
  values (p_recruiter_id, p_organization_id, p_candidate_id, p_job_id, true, now())
  on conflict (recruiter_id, user_id, job_id)
  do update set contact_unlocked = true, unlocked_at = now(), status = 'shortlisted'
  returning id into v_shortlist_id;

  -- 3. Deduct credit (atomic with the lock above)
  update organizations
  set unlock_credits = unlock_credits - 1
  where id = p_organization_id;

  -- 4. Record in ledger
  insert into credit_transactions (organization_id, recruiter_id, shortlist_id, delta, reason)
  values (p_organization_id, p_recruiter_id, v_shortlist_id, -1, 'contact_unlock');

  -- 5. Notify the candidate
  insert into notifications (user_id, type, payload)
  values (p_candidate_id, 'shortlisted', jsonb_build_object('org_id', p_organization_id));

  -- 6. Fetch the now-unlocked email
  select email into v_email from users where id = p_candidate_id;

  return jsonb_build_object(
    'shortlist_id',      v_shortlist_id,
    'email',             v_email,
    'credits_remaining', v_credits - 1
  );
end;
$$;

-- ── Pulse score recompute function ───────────────────────────
-- Called by the nightly scheduler (scheduler.py) and after on-demand sync.
-- Weights: recency 40pts, diversity 30pts, consistency 30pts.
create or replace function recompute_pulse_score(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_recency      int;
  v_diversity    int;
  v_consistency  int;
  v_total        int;
  v_skills       jsonb;
  v_sparkline    int[];
  v_day          date;
  v_day_score    int;
  i              int;
begin
  -- RECENCY (0-40): avg impact of entries in last 30 days, scaled to 40
  select coalesce(
    least(40, round(avg(impact_score) * 4))::int,
    0
  )
  into v_recency
  from pulse_entries
  where user_id = p_user_id
    and occurred_at >= now() - interval '30 days';

  -- DIVERSITY (0-30): number of distinct platforms × distinct entry_types, scaled to 30
  select coalesce(
    least(30, (count(distinct platform) * count(distinct entry_type) / 2))::int,
    0
  )
  into v_diversity
  from pulse_entries
  where user_id = p_user_id;

  -- CONSISTENCY (0-30): count of distinct active weeks in last 12 weeks, out of 12
  select coalesce(
    least(30, count(distinct date_trunc('week', occurred_at)) * 30 / 12)::int,
    0
  )
  into v_consistency
  from pulse_entries
  where user_id = p_user_id
    and occurred_at >= now() - interval '12 weeks';

  v_total := v_recency + v_diversity + v_consistency;

  -- SKILL SCORES: per-tag weighted average impact, top 10 skills
  select coalesce(
    jsonb_object_agg(
      tag,
      least(100, round(avg_impact * 10)::int)
    ),
    '{}'::jsonb
  )
  into v_skills
  from (
    select
      unnest(tags) as tag,
      avg(impact_score) as avg_impact
    from pulse_entries
    where user_id = p_user_id
    group by tag
    order by avg_impact desc
    limit 10
  ) skill_agg;

  -- SPARKLINE: last 7 days' daily totals (simplified: use v_total for now;
  -- production: store a separate daily_pulse_scores table for exact per-day values)
  v_sparkline := array[]::int[];
  for i in 0..6 loop
    v_day := current_date - i;
    select coalesce(
      least(100, round(avg(impact_score) * 10))::int,
      0
    )
    into v_day_score
    from pulse_entries
    where user_id = p_user_id
      and occurred_at::date = v_day;
    v_sparkline := array_prepend(v_day_score, v_sparkline);
  end loop;

  -- UPSERT the score row
  insert into pulse_scores (user_id, total, recency, diversity, consistency, sparkline, skill_scores, computed_at)
  values (p_user_id, v_total, v_recency, v_diversity, v_consistency, v_sparkline, v_skills, now())
  on conflict (user_id)
  do update set
    total        = excluded.total,
    recency      = excluded.recency,
    diversity    = excluded.diversity,
    consistency  = excluded.consistency,
    sparkline    = excluded.sparkline,
    skill_scores = excluded.skill_scores,
    computed_at  = excluded.computed_at;
end;
$$;

-- ── Materialized view: leaderboard (refreshed nightly) ──────
-- Avoids a full-table scan on pulse_scores for the recruiter feed.
create materialized view candidate_leaderboard as
select
  ps.user_id,
  ps.total          as pulse_score,
  ps.skill_scores,
  u.target_domains,
  u.target_roles,
  u.years_exp,
  u.created_at
from pulse_scores ps
join users u on u.id = ps.user_id
where u.onboarded = true
order by ps.total desc;

create unique index idx_candidate_leaderboard_user on candidate_leaderboard (user_id);
create index idx_candidate_leaderboard_score       on candidate_leaderboard (pulse_score desc);
create index idx_candidate_leaderboard_skills      on candidate_leaderboard using gin (skill_scores);
create index idx_candidate_leaderboard_domains     on candidate_leaderboard using gin (target_domains);

-- Refresh command (run nightly from scheduler.py after all scores recomputed):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY candidate_leaderboard;
-- The CONCURRENTLY option requires the unique index and avoids locking reads.

-- ── Partitioning plan for pulse_entries ─────────────────────
-- At 10K users × ~200 entries/user/year = 2M rows/year.
-- Partition by RANGE on ingested_at (monthly) once you hit 5M+ rows.
-- Below is the DDL to convert (run in a maintenance window):
--
-- CREATE TABLE pulse_entries_partitioned (LIKE pulse_entries INCLUDING ALL)
--   PARTITION BY RANGE (ingested_at);
--
-- CREATE TABLE pulse_entries_2026_01 PARTITION OF pulse_entries_partitioned
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- (repeat for each month)
--
-- For now, the GIN + BRIN index combination handles the load:

-- BRIN index on ingested_at: tiny overhead, good for sequential scans on time ranges
create index idx_pulse_entries_brin_ingested on pulse_entries
  using brin (ingested_at) with (pages_per_range = 32);

-- ── mission_logs retention policy ───────────────────────────
-- mission_logs rows older than 90 days are moved to cold storage / deleted.
-- Schedule via pg_cron (Supabase extension):
--
-- select cron.schedule(
--   'purge-old-mission-logs',
--   '0 3 * * 0',    -- every Sunday at 03:00 UTC
--   $$
--     delete from mission_logs
--     where created_at < now() - interval '90 days';
--   $$
-- );

-- ── Connection pooling note ──────────────────────────────────
-- Supabase uses PgBouncer in transaction mode by default.
-- For 10K users:
--   - Set pool_size = 20 per backend instance (FastAPI)
--   - Run 3 FastAPI replicas behind a load balancer
--   - Total: 60 connections → well within Supabase's default 500-connection limit
--
-- For Realtime specifically: Supabase Realtime uses a separate multiplexed
-- WebSocket server — it does NOT consume Postgres connections per subscriber.
-- 10K concurrent Realtime subscribers is supported on the Pro plan.
