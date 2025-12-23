-- Refresh applications RLS to use auth.uid() and avoid JWT tenant claims
alter table if exists public.applications enable row level security;
alter table if exists public.candidates enable row level security;

-- Applications policies
drop policy if exists "Applications: tenant recruiters view" on public.applications;
drop policy if exists "Applications: candidate views own" on public.applications;
drop policy if exists "Applications: admins & recruiters insert" on public.applications;
drop policy if exists "Applications: admins & recruiters update" on public.applications;

create policy "Applications: tenant recruiters view (uid)" on public.applications
  for select to authenticated
  using (
    tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) in ('admin','recruiter')
  );

create policy "Applications: candidate views own (uid)" on public.applications
  for select to authenticated
  using (
    candidate_id in (select id from public.candidates where user_id = auth.uid())
  );

create policy "Applications: admins & recruiters insert (uid)" on public.applications
  for insert to authenticated
  with check (
    tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) in ('admin','recruiter')
  );

create policy "Applications: admins & recruiters update (uid)" on public.applications
  for update to authenticated
  using (
    tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) in ('admin','recruiter')
  )
  with check (
    tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) in ('admin','recruiter')
  );

-- Candidates policy refresh for recruiter/admin access using uid/tenant lookup (no recursion)
drop policy if exists "Candidates: tenant recruiters see tenant-owned imports" on public.candidates;
create policy "Candidates: tenant recruiters see tenant-owned imports (uid)" on public.candidates
  for select to authenticated
  using (
    owner_tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) in ('admin','recruiter')
  );
