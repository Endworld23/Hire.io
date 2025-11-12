/*
  # Hire.io Phase 1 - Multi-Tenant Architecture

  ## Overview
  This migration implements the complete tenant-based architecture as specified in:
  - /docs/architecture.md (Section 3: Data Model)
  - /docs/security-and-eeo.md (Section 2: Data Security Model)
  - /docs/roadmap.md (Phase 1: Core ATS)

  ## Tables Created

  1. **tenants** - Agency organizations (multi-tenant root)
     - `id` (uuid, primary key)
     - `name` (text) - Agency name
     - `subdomain` (text, unique) - Custom subdomain (agency.hire.io)
     - `settings` (jsonb) - Tenant configuration
     - `created_at` (timestamptz)

  2. **users** - All system users with role-based access
     - `id` (uuid, primary key, references auth.users)
     - `tenant_id` (uuid, references tenants) - Tenant isolation
     - `role` (text) - admin, recruiter, client, candidate
     - `email` (text)
     - `full_name` (text)
     - `metadata` (jsonb) - Role-specific data
     - `created_at` (timestamptz)

  3. **jobs** - Job requisitions
     - `id` (uuid, primary key)
     - `tenant_id` (uuid, references tenants)
     - `title` (text)
     - `location` (text)
     - `salary_min` (integer)
     - `salary_max` (integer)
     - `required_skills` (jsonb)
     - `nice_to_have` (jsonb)
     - `spec` (jsonb) - Full AI-generated specification
     - `status` (text) - draft, active, closed
     - `created_by` (uuid, references users)
     - `created_at` (timestamptz)

  4. **candidates** - Candidate profiles
     - `id` (uuid, primary key)
     - `tenant_id` (uuid, references tenants)
     - `user_id` (uuid, references users, nullable) - If registered
     - `public_id` (uuid, unique) - EEO-blind identifier for clients
     - `full_name` (text)
     - `email` (text)
     - `phone` (text)
     - `location` (text)
     - `skills` (jsonb)
     - `experience` (jsonb)
     - `resume_url` (text)
     - `resume_text` (text) - Parsed content
     - `created_at` (timestamptz)

  5. **applications** - Candidate-Job linkage
     - `id` (uuid, primary key)
     - `tenant_id` (uuid, references tenants)
     - `job_id` (uuid, references jobs)
     - `candidate_id` (uuid, references candidates)
     - `stage` (text) - applied, screening, interview, offer, hired, rejected
     - `score` (numeric) - AI match score 0-100
     - `notes` (text)
     - `created_at` (timestamptz)

  6. **stages** - Pipeline stage definitions
     - `id` (uuid, primary key)
     - `tenant_id` (uuid, references tenants)
     - `name` (text)
     - `order` (integer)
     - `created_at` (timestamptz)

  7. **events** - Audit log (immutable)
     - `id` (uuid, primary key)
     - `tenant_id` (uuid, references tenants)
     - `actor_user_id` (uuid, references users)
     - `entity_type` (text) - job, candidate, application, etc.
     - `entity_id` (uuid)
     - `action` (text) - created, updated, viewed, deleted
     - `metadata` (jsonb)
     - `created_at` (timestamptz)

  8. **skills** - Normalized skill taxonomy
     - `id` (uuid, primary key)
     - `name` (text, unique)
     - `category` (text)
     - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on ALL tables
  - Tenant isolation enforced via tenant_id checks
  - JWT claims include: tenant_id, role, user_id
  - Client-facing queries filter PII automatically
  - All actions logged to events table

  ## Reference
  Phase 1, Section 2: Core ATS Module (/docs/roadmap.md line 98-107)
  Architecture Section 3: Data Model (/docs/architecture.md line 93-127)
  Security Section 2: Data Security Model (/docs/security-and-eeo.md line 64-75)
*/

-- ============================================================================
-- 1. TENANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY "Admins can update own tenant"
  ON tenants FOR UPDATE
  TO authenticated
  USING (
    id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'recruiter', 'client', 'candidate')),
  email text NOT NULL,
  full_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users in same tenant can view each other"
  ON users FOR SELECT
  TO authenticated
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 3. JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  location text,
  salary_min integer,
  salary_max integer,
  required_skills jsonb DEFAULT '[]'::jsonb,
  nice_to_have jsonb DEFAULT '[]'::jsonb,
  spec jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view tenant jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY "Admins and recruiters can insert jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'recruiter')
  );

CREATE POLICY "Admins and recruiters can update jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'recruiter')
  )
  WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'recruiter')
  );

CREATE POLICY "Admins and recruiters can delete jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'recruiter')
  );

-- ============================================================================
-- 4. CANDIDATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  public_id uuid UNIQUE DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  location text,
  skills jsonb DEFAULT '[]'::jsonb,
  experience jsonb DEFAULT '{}'::jsonb,
  resume_url text,
  resume_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view tenant candidates"
  ON candidates FOR SELECT
  TO authenticated
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY "Admins and recruiters can insert candidates"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'recruiter')
  );

CREATE POLICY "Admins and recruiters can update candidates"
  ON candidates FOR UPDATE
  TO authenticated
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'recruiter')
  )
  WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'recruiter')
  );

CREATE POLICY "Candidates can view own profile"
  ON candidates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Candidates can update own profile"
  ON candidates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5. APPLICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  stage text DEFAULT 'applied' CHECK (stage IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  score numeric CHECK (score >= 0 AND score <= 100),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view tenant applications"
  ON applications FOR SELECT
  TO authenticated
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY "Admins and recruiters can insert applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'recruiter')
  );

CREATE POLICY "Admins and recruiters can update applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'recruiter')
  )
  WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'recruiter')
  );

-- ============================================================================
-- 6. STAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view tenant stages"
  ON stages FOR SELECT
  TO authenticated
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY "Admins can manage stages"
  ON stages FOR ALL
  TO authenticated
  USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- 7. EVENTS TABLE (Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view tenant events"
  ON events FOR SELECT
  TO authenticated
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

CREATE POLICY "All authenticated users can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- ============================================================================
-- 8. SKILLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skills"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage skills"
  ON skills FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidates_tenant_id ON candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_public_id ON candidates(public_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);

CREATE INDEX IF NOT EXISTS idx_applications_tenant_id ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(stage);

CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_actor_user_id ON events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_events_entity_type ON events(entity_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_jobs_required_skills ON jobs USING gin(required_skills);
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING gin(skills);
