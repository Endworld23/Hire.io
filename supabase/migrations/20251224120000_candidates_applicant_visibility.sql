-- Enable recruiter/admin visibility for applicants without RLS recursion
create or replace function public.visible_candidate_ids_for_tenant()
returns setof uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  with current_tenant as (
    select tenant_id
    from public.users
    where id = auth.uid()
  )
  select a.candidate_id
  from public.applications a
  join current_tenant t on a.tenant_id = t.tenant_id
  where t.tenant_id is not null;
$$;

grant execute on function public.visible_candidate_ids_for_tenant() to authenticated;

alter table if exists public.candidates enable row level security;

drop policy if exists "Candidates: tenant recruiters see tenant-owned imports (uid)" on public.candidates;
drop policy if exists "Candidates: tenant recruiters view applicants (non-recursive)" on public.candidates;

create policy "Candidates: tenant recruiters view applicants (non-recursive)"
  on public.candidates
  for select to authenticated
  using (
    (select role from public.users where id = auth.uid()) in ('admin','recruiter')
    and (
      owner_tenant_id = (select tenant_id from public.users where id = auth.uid())
      or id in (select * from public.visible_candidate_ids_for_tenant())
    )
  );

create index if not exists idx_applications_tenant_candidate_id
  on public.applications(tenant_id, candidate_id);
