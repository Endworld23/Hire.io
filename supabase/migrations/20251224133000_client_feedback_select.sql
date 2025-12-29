-- Client portal: allow feedback read access scoped to tenant
alter table if exists public.job_application_feedback enable row level security;

drop policy if exists "Feedback: client select (uid)" on public.job_application_feedback;
create policy "Feedback: client select (uid)" on public.job_application_feedback
  for select to authenticated
  using (
    tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) = 'client'
  );
