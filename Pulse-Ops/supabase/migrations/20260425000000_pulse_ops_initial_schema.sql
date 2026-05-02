-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    github_username TEXT,
    leetcode_username TEXT,
    linkedin_url TEXT,
    phone TEXT,
    pulse_score INTEGER DEFAULT 0,
    opt_in_recruiter_feed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
DO $$ 
BEGIN
    ALTER TABLE users ADD COLUMN full_name TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE users ADD COLUMN github_username TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE users ADD COLUMN leetcode_username TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE users ADD COLUMN linkedin_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE users ADD COLUMN phone TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE users ADD COLUMN pulse_score INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE users ADD COLUMN opt_in_recruiter_feed BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. pulse_entries table
DO $$ BEGIN
    CREATE TYPE activity_source_enum AS ENUM ('github', 'supabase', 'leetcode', 'n8n_webhook');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS pulse_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_source activity_source_enum NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    raw_metric TEXT,
    proof_url TEXT,
    inferred_skill TEXT,
    impact_weight INTEGER CHECK (impact_weight >= 1 AND impact_weight <= 10),
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. jobs table
DO $$ BEGIN
    CREATE TYPE job_status_enum AS ENUM ('new', 'matched', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    source_url TEXT,
    raw_markdown TEXT,
    hard_requirements JSONB,
    salary_range TEXT,
    location TEXT,
    domain TEXT,
    embedding vector(1536),
    status job_status_enum DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. missions table
DO $$ BEGIN
    CREATE TYPE mission_status_enum AS ENUM ('scouting', 'tailoring', 'awaiting_approval', 'submitted', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS missions (
    mission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    status mission_status_enum DEFAULT 'scouting',
    match_score INTEGER,
    justification_narrative TEXT,
    verified_evidence_links JSONB,
    tailored_pdf_url TEXT,
    hitl_questions JSONB,
    hitl_responses JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. mission_parameters table
CREATE TABLE IF NOT EXISTS mission_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_roles TEXT[],
    target_domains TEXT[],
    target_companies TEXT[],
    min_salary INTEGER,
    max_salary INTEGER,
    location_preference TEXT
);

-- 6. recruiter_profiles table
CREATE TABLE IF NOT EXISTS recruiter_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    job_schemas JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable pgvector extension. Add indexes on pulse_entries.embedding and jobs.embedding using ivfflat.
CREATE INDEX IF NOT EXISTS pulse_entries_embedding_idx ON pulse_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS jobs_embedding_idx ON jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies: users can only read/write their own data.
-- Users
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- pulse_entries
DROP POLICY IF EXISTS "Users can read own pulse_entries" ON pulse_entries;
CREATE POLICY "Users can read own pulse_entries" ON pulse_entries FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pulse_entries" ON pulse_entries;
CREATE POLICY "Users can insert own pulse_entries" ON pulse_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pulse_entries" ON pulse_entries;
CREATE POLICY "Users can update own pulse_entries" ON pulse_entries FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pulse_entries" ON pulse_entries;
CREATE POLICY "Users can delete own pulse_entries" ON pulse_entries FOR DELETE USING (auth.uid() = user_id);

-- jobs
DROP POLICY IF EXISTS "Users can read jobs" ON jobs;
CREATE POLICY "Users can read jobs" ON jobs FOR SELECT USING (true);

-- missions
DROP POLICY IF EXISTS "Users can read own missions" ON missions;
CREATE POLICY "Users can read own missions" ON missions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own missions" ON missions;
CREATE POLICY "Users can insert own missions" ON missions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own missions" ON missions;
CREATE POLICY "Users can update own missions" ON missions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own missions" ON missions;
CREATE POLICY "Users can delete own missions" ON missions FOR DELETE USING (auth.uid() = user_id);

-- mission_parameters
DROP POLICY IF EXISTS "Users can read own mission_parameters" ON mission_parameters;
CREATE POLICY "Users can read own mission_parameters" ON mission_parameters FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mission_parameters" ON mission_parameters;
CREATE POLICY "Users can insert own mission_parameters" ON mission_parameters FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mission_parameters" ON mission_parameters;
CREATE POLICY "Users can update own mission_parameters" ON mission_parameters FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mission_parameters" ON mission_parameters;
CREATE POLICY "Users can delete own mission_parameters" ON mission_parameters FOR DELETE USING (auth.uid() = user_id);

-- recruiter_profiles
DROP POLICY IF EXISTS "Recruiters can read own profile" ON recruiter_profiles;
CREATE POLICY "Recruiters can read own profile" ON recruiter_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Recruiters can update own profile" ON recruiter_profiles;
CREATE POLICY "Recruiters can update own profile" ON recruiter_profiles FOR UPDATE USING (auth.uid() = id);

-- Recruiters can read pulse_entries where user has opted into the recruiter feed.
DROP POLICY IF EXISTS "Recruiters can read opted in pulse_entries" ON pulse_entries;
CREATE POLICY "Recruiters can read opted in pulse_entries" ON pulse_entries FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM recruiter_profiles WHERE recruiter_profiles.id = auth.uid()
    ) AND EXISTS (
        SELECT 1 FROM users WHERE users.id = pulse_entries.user_id AND users.opt_in_recruiter_feed = true
    )
);
