/*
  # Add match_score column to applications

  Stores deterministic matching engine results per application so both internal
  pipeline and client shortlist can consume the same value.
*/

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS match_score numeric;

CREATE INDEX IF NOT EXISTS idx_applications_match_score
  ON applications(match_score);
