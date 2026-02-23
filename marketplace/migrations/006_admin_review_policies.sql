-- Admin access for reviewing provider applications

drop policy if exists profiles_select_admin_all on public.profiles;
create policy profiles_select_admin_all
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists profiles_update_admin_all on public.profiles;
create policy profiles_update_admin_all
on public.profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists pro_documents_select_admin_all on public.pro_documents;
create policy pro_documents_select_admin_all
on public.pro_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);
