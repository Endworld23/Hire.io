-- Polish helper function to ensure distinct candidate IDs
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
  select distinct a.candidate_id
  from public.applications a
  join current_tenant t on a.tenant_id = t.tenant_id
  where t.tenant_id is not null;
$$;
