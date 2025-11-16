/*
  # Extend application stages for client shortlist actions

  Adds client_shortlisted and client_rejected stages so the client portal
  can reflect shortlist decisions without leaking PII.
*/

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_stage_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_stage_check
  CHECK (
    stage IN (
      'applied',
      'screening',
      'interview',
      'offer',
      'hired',
      'rejected',
      'client_shortlisted',
      'client_rejected'
    )
  );
