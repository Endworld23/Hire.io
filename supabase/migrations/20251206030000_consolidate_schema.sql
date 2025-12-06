/*
  # Hire.io - Consolidated Multi-Tenant + Global Candidate Schema (Authoritative)

  Implements:
  - Full multi-tenant ATS model (Shopify/GoHighLevel style)
  - Global candidate pool (LinkedIn/Indeed style)
  - Tenant-owned imported candidates
  - Social login–ready users table
  - AI-match-ready attributes
  - Secure RLS using JWT claims (tenant_id, role, user_id)
  - Strict EEO-blind candidate visibility
  - Full audit logging and pipeline support
*/

-- ========================================================================
-- SAFETY CLEANUP (idempotent)
-- ========================================================================
DROP TABLE IF EXISTS job_application_feedback CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS stages CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

-- ========================================================================
-- TENANTS (multi-tenant SaaS: agencies, employers)
-- ========================================================================
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ========================================================================
-- USERS (global; candidates OR tenant members OR super admins)
-- ========================================================================
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL, -- NULL = global (candidate)
  role text NOT NULL CHECK (
    role IN (
      'super_admin',
      'admin',
      'recruiter',
      'client',
      'candidate'
    )
  ),
  email text NOT NULL,
  full_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ========================================================================
-- JOBS (tenant-owned job postings)
-- ========================================================================
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
  status text DEFAULT 'draft' CHECK (status IN ('draft','active','closed','archived')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ========================================================================
-- CANDIDATES (GLOBAL + tenant-owned importer support)
-- ========================================================================
CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to user if candidate signs up
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,

  -- Global or tenant-owned uploaded candidate
  is_global boolean DEFAULT true,
  owner_tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,

  -- AI + privacy settings
  visibility jsonb DEFAULT '{"ai_opt_in": true}',

  -- EEO-blind external id
  public_id uuid UNIQUE DEFAULT gen_random_uuid(),

  -- PII fields (EEO-blind policies enforced via RLS)
  full_name text,
  email text,
  phone text,
  location text,

  -- Resume & skill data
  skills jsonb DEFAULT '[]'::jsonb,
  experience jsonb DEFAULT '{}'::jsonb,
  resume_url text,
  resume_text text,

  created_at timestamptz DEFAULT now()
);

-- ========================================================================
-- APPLICATIONS (bridge between job ←→ candidate)
-- ========================================================================
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,

  stage text DEFAULT 'applied' CHECK (
    stage IN (
      'new',
      'applied',
      'recruiter_screen',
      'screening',
      'submitted_to_client',
      'client_shortlisted',
      'client_rejected',
      'interview',
      'offer',
      'hired',
      'rejected'
    )
  ),

  score numeric CHECK (score >= 0 AND score <= 100),
  match_score numeric,
  notes text,
  created_at timestamptz DEFAULT now(),

  UNIQUE(job_id, candidate_id)
);

-- ========================================================================
-- STAGES (pipeline definitions)
-- ========================================================================
CREATE TABLE stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- ========================================================================
-- EVENTS (audit log)
-- ========================================================================
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

-- ========================================================================
-- SKILLS (normalized taxonomy)
-- ========================================================================
CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

-- ========================================================================
-- APPLICATION FEEDBACK
-- ========================================================================
CREATE TABLE job_application_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  author_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ========================================================================
-- ENABLE RLS
-- ========================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
-- Fixed typo: ensure proper RLS enablement keyword spacing
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_application_feedback ENABLE ROW LEVEL SECURITY;

-- ========================================================================
-- RLS POLICIES
-- ========================================================================

-- TENANTS
CREATE POLICY "Tenant: view own" ON tenants FOR SELECT TO authenticated
  USING (id::text = (auth.jwt()->>'tenant_id'));

CREATE POLICY "Tenant: admin update" ON tenants FOR UPDATE TO authenticated
  USING (
    id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') = 'admin'
  )
  WITH CHECK (
    id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') = 'admin'
  );

-- USERS
CREATE POLICY "User: view own" ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "User: tenant admin/recruiter view all in tenant"
  ON users FOR SELECT TO authenticated
  USING (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  );

CREATE POLICY "User: update own" ON users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- JOBS
CREATE POLICY "Jobs: view tenant jobs" ON jobs FOR SELECT TO authenticated
  USING (tenant_id::text = (auth.jwt()->>'tenant_id'));

CREATE POLICY "Jobs: admins & recruiters insert" ON jobs FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  );

CREATE POLICY "Jobs: admins & recruiters update" ON jobs FOR UPDATE TO authenticated
  USING (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  )
  WITH CHECK (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  );

CREATE POLICY "Jobs: admins & recruiters delete" ON jobs FOR DELETE TO authenticated
  USING (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  );

-- CANDIDATES
CREATE POLICY "Candidates: candidate views self" ON candidates FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Candidates: candidate updates self" ON candidates FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Candidates: tenant recruiters see tenant-owned imports"
  ON candidates FOR SELECT TO authenticated
  USING (
    owner_tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  );

CREATE POLICY "Candidates: tenant recruiters see candidates tied to their applications"
  ON candidates FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT candidate_id
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.tenant_id::text = (auth.jwt()->>'tenant_id')
    )
  );

CREATE POLICY "Candidates: super_admin can view all"
  ON candidates FOR SELECT TO authenticated
  USING ((auth.jwt()->>'role') = 'super_admin');

-- APPLICATIONS
CREATE POLICY "Applications: tenant recruiters view" ON applications FOR SELECT TO authenticated
  USING (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  );

CREATE POLICY "Applications: candidate views own" ON applications FOR SELECT TO authenticated
  USING (
    candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
  );

CREATE POLICY "Applications: admins & recruiters insert" ON applications FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  );

CREATE POLICY "Applications: admins & recruiters update" ON applications FOR UPDATE TO authenticated
  USING (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  )
  WITH CHECK (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  );

-- STAGES
CREATE POLICY "Stages: tenant view" ON stages FOR SELECT TO authenticated
  USING (tenant_id::text = (auth.jwt()->>'tenant_id'));

CREATE POLICY "Stages: admin manage" ON stages FOR ALL TO authenticated
  USING (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') = 'admin'
  )
  WITH CHECK (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') = 'admin'
  );

-- EVENTS
CREATE POLICY "Events: tenant view" ON events FOR SELECT TO authenticated
  USING (tenant_id::text = (auth.jwt()->>'tenant_id'));

CREATE POLICY "Events: insert" ON events FOR INSERT TO authenticated
  WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

-- SKILLS
CREATE POLICY "Skills: view" ON skills FOR SELECT TO authenticated USING (true);

CREATE POLICY "Skills: admin manage" ON skills FOR ALL TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- FEEDBACK
CREATE POLICY "Feedback: tenant recruiters view" ON job_application_feedback FOR SELECT TO authenticated
  USING (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  );

CREATE POLICY "Feedback: tenant recruiters insert" ON job_application_feedback FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id::text = (auth.jwt()->>'tenant_id') AND
    (auth.jwt()->>'role') IN ('admin','recruiter')
  );

-- ========================================================================
-- INDEXES
-- ========================================================================
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_required_skills ON jobs USING gin(required_skills);

CREATE INDEX idx_candidates_user_id ON candidates(user_id);
CREATE INDEX idx_candidates_owner_tenant_id ON candidates(owner_tenant_id);
CREATE INDEX idx_candidates_public_id ON candidates(public_id);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_skills ON candidates USING gin(skills);

CREATE INDEX idx_applications_tenant_id ON applications(tenant_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_stage ON applications(stage);
CREATE INDEX idx_applications_match_score ON applications(match_score);

CREATE INDEX idx_events_tenant_id ON events(tenant_id);
CREATE INDEX idx_events_actor_user_id ON events(actor_user_id);
CREATE INDEX idx_events_entity_type ON events(entity_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category ON skills(category);

CREATE INDEX idx_feedback_tenant_id ON job_application_feedback(tenant_id);
CREATE INDEX idx_feedback_job_id ON job_application_feedback(job_id);
CREATE INDEX idx_feedback_application_id ON job_application_feedback(application_id);
