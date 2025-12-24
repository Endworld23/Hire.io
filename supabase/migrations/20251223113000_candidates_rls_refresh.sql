-- Refresh candidates RLS to allow tenant admin/recruiter insert/update
alter table if exists public.candidates enable row level security;

drop policy if exists "Candidates: tenant recruiters insert" on public.candidates;
drop policy if exists "Candidates: tenant recruiters update" on public.candidates;
drop policy if exists "Candidates: tenant recruiters insert (uid)" on public.candidates;
drop policy if exists "Candidates: tenant recruiters update (uid)" on public.candidates;

create policy "Candidates: tenant recruiters insert (uid)" on public.candidates
  for insert to authenticated
  with check (
    owner_tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) in ('admin','recruiter')
  );

create policy "Candidates: tenant recruiters update (uid)" on public.candidates
  for update to authenticated
  using (
    owner_tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) in ('admin','recruiter')
  )
  with check (
    owner_tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) in ('admin','recruiter')
  );
