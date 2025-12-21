-- Ensure RLS is enabled
alter table if exists public.jobs enable row level security;
alter table if exists public.users enable row level security;

-- Users: allow each authenticated user to select their own profile
drop policy if exists "User: view own (uid)" on public.users;
create policy "User: view own (uid)" on public.users
  for select to authenticated
  using (id = auth.uid());

-- Jobs: tenant-scoped select
drop policy if exists "Jobs: tenant select (uid)" on public.jobs;
create policy "Jobs: tenant select (uid)" on public.jobs
  for select to authenticated
  using (
    tenant_id = (
      select tenant_id from public.users where id = auth.uid()
    )
  );

-- Jobs: tenant insert
drop policy if exists "Jobs: tenant insert (uid)" on public.jobs;
create policy "Jobs: tenant insert (uid)" on public.jobs
  for insert to authenticated
  with check (
    tenant_id = (
      select tenant_id from public.users where id = auth.uid()
    )
  );

-- Jobs: tenant update
drop policy if exists "Jobs: tenant update (uid)" on public.jobs;
create policy "Jobs: tenant update (uid)" on public.jobs
  for update to authenticated
  using (
    tenant_id = (
      select tenant_id from public.users where id = auth.uid()
    )
  )
  with check (
    tenant_id = (
      select tenant_id from public.users where id = auth.uid()
    )
  );
