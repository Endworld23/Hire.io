/*
  # Drop Phase 0 Schema

  This migration drops the Phase 0 tables to make way for the proper tenant-based architecture.
*/

DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS job_intake CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS employers CASCADE;
