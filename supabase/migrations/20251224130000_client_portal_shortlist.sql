-- Client portal: EEO-blind shortlist + feedback access
create or replace function public.client_job_shortlist(p_job_id uuid)
returns table (
  application_id uuid,
  candidate_id uuid,
  candidate_public_id uuid,
  stage text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with profile as (
    select tenant_id, role
    from public.users
    where id = auth.uid()
  )
  select
    a.id,
    a.candidate_id,
    c.public_id,
    a.stage,
    a.created_at
  from public.applications a
  join public.candidates c on c.id = a.candidate_id
  join profile p on p.tenant_id = a.tenant_id
  where p.tenant_id is not null
    and p.role = 'client'
    and a.job_id = p_job_id;
$$;

grant execute on function public.client_job_shortlist(uuid) to authenticated;

alter table if exists public.applications enable row level security;
alter table if exists public.job_application_feedback enable row level security;

drop policy if exists "Applications: client view tenant (uid)" on public.applications;
create policy "Applications: client view tenant (uid)" on public.applications
  for select to authenticated
  using (
    tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) = 'client'
  );

drop policy if exists "Feedback: client insert (uid)" on public.job_application_feedback;
create policy "Feedback: client insert (uid)" on public.job_application_feedback
  for insert to authenticated
  with check (
    tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) = 'client'
  );
