/*
  # Application feedback table

  Allows internal recruiters to leave structured feedback per application.
*/

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

ALTER TABLE job_application_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedback in their tenant"
  ON job_application_feedback FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert feedback in their tenant"
  ON job_application_feedback FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE INDEX idx_feedback_tenant_id ON job_application_feedback(tenant_id);
CREATE INDEX idx_feedback_job_id ON job_application_feedback(job_id);
CREATE INDEX idx_feedback_application_id ON job_application_feedback(application_id);
