/*
  # Hire.io Phase 1 - Multi-Tenant Architecture

  ## Overview
  This migration implements the complete tenant-based architecture as specified in:
  - /docs/architecture.md (Section 3: Data Model)
  - /docs/security-and-eeo.md (Section 2: Data Security Model)
  - /docs/roadmap.md (Phase 1: Core ATS)

  ## Tables Created

  1. **tenants** - Agency organizations
  2. **users** - System users with RBAC
  3. **jobs** - Job requisitions
  4. **candidates** - Candidate profiles with EEO-blind public_id
  5. **applications** - Candidate-Job linkage
  6. **stages** - Pipeline stage definitions
  7. **events** - Audit log
  8. **skills** - Normalized skill taxonomy

  ## Security
  - Row Level Security (RLS) enabled on ALL tables
  - Tenant isolation enforced via tenant_id checks
  - Initial policies allow authenticated users within same tenant
  - JWT claims (tenant_id, role) will be added via auth hooks

  ## Reference
  Phase 1, Section 2: Core ATS Module (/docs/roadmap.md line 98-107)
*/

-- ============================================================================
-- 1. TENANTS TABLE
-- ============================================================================

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================

CREATE TABLE users (
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

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 3. JOBS TABLE
-- ============================================================================

CREATE TABLE jobs (
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

CREATE POLICY "Users can view jobs in their tenant"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert jobs in their tenant"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update jobs in their tenant"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete jobs in their tenant"
  ON jobs FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE INDEX idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_required_skills ON jobs USING gin(required_skills);

-- ============================================================================
-- 4. CANDIDATES TABLE
-- ============================================================================

CREATE TABLE candidates (
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

CREATE POLICY "Users can view candidates in their tenant"
  ON candidates FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can insert candidates in their tenant"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update candidates in their tenant"
  ON candidates FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE INDEX idx_candidates_tenant_id ON candidates(tenant_id);
CREATE INDEX idx_candidates_user_id ON candidates(user_id);
CREATE INDEX idx_candidates_public_id ON candidates(public_id);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_skills ON candidates USING gin(skills);

-- ============================================================================
-- 5. APPLICATIONS TABLE
-- ============================================================================

CREATE TABLE applications (
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

CREATE POLICY "Users can view applications in their tenant"
  ON applications FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert applications in their tenant"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update applications in their tenant"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE INDEX idx_applications_tenant_id ON applications(tenant_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_stage ON applications(stage);

-- ============================================================================
-- 6. STAGES TABLE
-- ============================================================================

CREATE TABLE stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stages in their tenant"
  ON stages FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage stages in their tenant"
  ON stages FOR ALL
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- ============================================================================
-- 7. EVENTS TABLE (Audit Log)
-- ============================================================================

CREATE TABLE events (
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

CREATE POLICY "Users can view events in their tenant"
  ON events FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert events in their tenant"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE INDEX idx_events_tenant_id ON events(tenant_id);
CREATE INDEX idx_events_actor_user_id ON events(actor_user_id);
CREATE INDEX idx_events_entity_type ON events(entity_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- ============================================================================
-- 8. SKILLS TABLE
-- ============================================================================

CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view skills"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage skills"
  ON skills FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category ON skills(category);
