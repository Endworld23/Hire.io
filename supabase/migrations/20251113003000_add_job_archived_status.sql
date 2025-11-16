/*
  # Allow jobs to be archived without deletion

  Adds 'archived' to the jobs.status enum constraint so internal users can deactivate
  jobs without removing history.
*/

ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE jobs
  ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('draft', 'active', 'closed', 'archived'));
