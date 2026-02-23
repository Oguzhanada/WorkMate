-- Secure addresses table access

alter table public.addresses enable row level security;

drop policy if exists addresses_select_own on public.addresses;
create policy addresses_select_own
on public.addresses
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists addresses_insert_own on public.addresses;
create policy addresses_insert_own
on public.addresses
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists addresses_update_own on public.addresses;
create policy addresses_update_own
on public.addresses
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists addresses_delete_own on public.addresses;
create policy addresses_delete_own
on public.addresses
for delete
to authenticated
using (profile_id = auth.uid());
