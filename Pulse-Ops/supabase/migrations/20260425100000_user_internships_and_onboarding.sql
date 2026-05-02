-- Migration: user_internships table + users.onboarding_completed + users.current_role columns

-- Add onboarding_completed flag to users
DO $$
BEGIN
    ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add current_role to users
DO $$
BEGIN
    ALTER TABLE users ADD COLUMN current_role TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add location_preference to users
DO $$
BEGIN
    ALTER TABLE users ADD COLUMN location_preference TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create user_internships table
CREATE TABLE IF NOT EXISTS user_internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    duration TEXT,
    project_description TEXT,
    skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS user_internships_user_id_idx ON user_internships(user_id);

-- Enable RLS
ALTER TABLE user_internships ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only CRUD their own internships
DROP POLICY IF EXISTS "Users can read own internships" ON user_internships;
CREATE POLICY "Users can read own internships" ON user_internships
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own internships" ON user_internships;
CREATE POLICY "Users can insert own internships" ON user_internships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own internships" ON user_internships;
CREATE POLICY "Users can update own internships" ON user_internships
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own internships" ON user_internships;
CREATE POLICY "Users can delete own internships" ON user_internships
    FOR DELETE USING (auth.uid() = user_id);
