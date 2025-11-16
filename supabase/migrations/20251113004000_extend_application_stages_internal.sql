/*
  # Expand application stages for internal pipeline actions

  Adds recruiter/internal stages to the applications.stage check constraint so recruiters can
  move candidates through the full pipeline without deletes.
*/

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_stage_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_stage_check
  CHECK (
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
  );
