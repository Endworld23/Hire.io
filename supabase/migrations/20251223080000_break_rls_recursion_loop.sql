-- Break recursive RLS evaluation between candidates and applications
-- This policy referenced applications and could recurse with application policies.
drop policy if exists "Candidates: tenant recruiters see candidates tied to their applications" on public.candidates;
