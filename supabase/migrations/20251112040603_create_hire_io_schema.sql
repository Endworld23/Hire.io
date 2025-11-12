/*
  # Hire.io Phase 0 Database Schema

  Creates the core database structure for Hire.io, an AI-powered hiring platform.

  ## Tables Created

  1. **employers**
     - `id` (uuid, primary key) - Unique employer identifier
     - `user_id` (uuid, references auth.users) - Link to auth user
     - `company_name` (text) - Name of the company
     - `industry` (text) - Industry sector
     - `created_at` (timestamptz) - Record creation timestamp

  2. **candidates**
     - `id` (uuid, primary key) - Unique candidate identifier
     - `user_id` (uuid, references auth.users) - Link to auth user
     - `full_name` (text) - Candidate's full name
     - `email` (text) - Contact email
     - `resume_url` (text) - URL to stored resume file
     - `resume_text` (text) - Parsed resume content
     - `skills` (jsonb) - Array of skills
     - `experience_years` (integer) - Years of experience
     - `created_at` (timestamptz) - Record creation timestamp

  3. **jobs**
     - `id` (uuid, primary key) - Unique job identifier
     - `employer_id` (uuid, references employers) - Job owner
     - `title` (text) - Job title
     - `description` (text) - Job description
     - `required_skills` (jsonb) - Array of required skills
     - `salary_min` (integer) - Minimum salary
     - `salary_max` (integer) - Maximum salary
     - `location` (text) - Job location
     - `status` (text) - Job status (draft, active, closed)
     - `created_at` (timestamptz) - Record creation timestamp

  4. **job_intake**
     - `id` (uuid, primary key) - Unique intake identifier
     - `job_id` (uuid, references jobs) - Associated job
     - `leniency_score` (integer) - Hiring leniency (1-10)
     - `priorities` (jsonb) - Hiring priorities
     - `dealbreakers` (jsonb) - Absolute requirements
     - `culture_fit` (text) - Culture fit preferences
     - `created_at` (timestamptz) - Record creation timestamp

  5. **matches**
     - `id` (uuid, primary key) - Unique match identifier
     - `job_id` (uuid, references jobs) - Associated job
     - `candidate_id` (uuid, references candidates) - Matched candidate
     - `match_score` (integer) - AI match score (0-100)
     - `is_shortlisted` (boolean) - Shortlist status
     - `employer_viewed` (boolean) - Has employer viewed
     - `created_at` (timestamptz) - Record creation timestamp

  6. **feedback**
     - `id` (uuid, primary key) - Unique feedback identifier
     - `match_id` (uuid, references matches) - Associated match
     - `employer_id` (uuid, references employers) - Feedback provider
     - `rating` (integer) - Rating (1-5)
     - `comments` (text) - Feedback comments
     - `created_at` (timestamptz) - Record creation timestamp

  ## Security

  - Row Level Security (RLS) enabled on all tables
  - Employers can only view/edit their own data
  - Candidates can only view/edit their own data
  - Matches visible to both employers and candidates
  - Admin users can view all data
*/

-- Create employers table
CREATE TABLE IF NOT EXISTS employers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view own profile"
  ON employers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Employers can update own profile"
  ON employers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can insert own profile"
  ON employers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  resume_url text,
  resume_text text,
  skills jsonb DEFAULT '[]'::jsonb,
  experience_years integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own profile"
  ON candidates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Candidates can update own profile"
  ON candidates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Candidates can insert own profile"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES employers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  required_skills jsonb DEFAULT '[]'::jsonb,
  salary_min integer,
  salary_max integer,
  location text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view own jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    employer_id IN (
      SELECT id FROM employers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can insert own jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    employer_id IN (
      SELECT id FROM employers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    employer_id IN (
      SELECT id FROM employers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    employer_id IN (
      SELECT id FROM employers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can delete own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (
    employer_id IN (
      SELECT id FROM employers WHERE user_id = auth.uid()
    )
  );

-- Create job_intake table
CREATE TABLE IF NOT EXISTS job_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  leniency_score integer DEFAULT 5,
  priorities jsonb DEFAULT '[]'::jsonb,
  dealbreakers jsonb DEFAULT '[]'::jsonb,
  culture_fit text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view own job intake"
  ON job_intake FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can insert own job intake"
  ON job_intake FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update own job intake"
  ON job_intake FOR UPDATE
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  match_score integer DEFAULT 0,
  is_shortlisted boolean DEFAULT false,
  employer_viewed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view matches for own jobs"
  ON matches FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update matches for own jobs"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  employer_id uuid REFERENCES employers(id) ON DELETE CASCADE NOT NULL,
  rating integer,
  comments text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    employer_id IN (
      SELECT id FROM employers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can insert own feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    employer_id IN (
      SELECT id FROM employers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update own feedback"
  ON feedback FOR UPDATE
  TO authenticated
  USING (
    employer_id IN (
      SELECT id FROM employers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    employer_id IN (
      SELECT id FROM employers WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employers_user_id ON employers(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_matches_job_id ON matches(job_id);
CREATE INDEX IF NOT EXISTS idx_matches_candidate_id ON matches(candidate_id);
CREATE INDEX IF NOT EXISTS idx_feedback_employer_id ON feedback(employer_id);
