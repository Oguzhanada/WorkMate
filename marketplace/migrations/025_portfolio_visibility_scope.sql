-- Provider portfolio visibility scope and experience sharing.

alter table public.pro_portfolio
  add column if not exists experience_note text not null default '',
  add column if not exists visibility_scope text not null default 'public';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pro_portfolio_visibility_scope_check'
  ) then
    alter table public.pro_portfolio
      add constraint pro_portfolio_visibility_scope_check
      check (visibility_scope in ('public', 'applied_customers'));
  end if;
end $$;

update public.pro_portfolio
set visibility_scope = case when is_public then 'public' else 'applied_customers' end
where visibility_scope is null
   or visibility_scope not in ('public', 'applied_customers');

drop policy if exists pro_portfolio_select_public_or_owner on public.pro_portfolio;
create policy pro_portfolio_select_public_or_owner
on public.pro_portfolio
for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
  or visibility_scope = 'public'
  or (
    visibility_scope = 'applied_customers'
    and exists (
      select 1
      from public.quotes q
      join public.jobs j on j.id = q.job_id
      where q.pro_id = pro_portfolio.profile_id
        and j.customer_id = auth.uid()
    )
  )
);
