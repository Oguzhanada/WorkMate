-- Allow authenticated users to manage only their own verification documents.

alter table public.pro_documents enable row level security;

drop policy if exists pro_documents_select_own on public.pro_documents;
create policy pro_documents_select_own
on public.pro_documents
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists pro_documents_insert_own on public.pro_documents;
create policy pro_documents_insert_own
on public.pro_documents
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists pro_documents_delete_own on public.pro_documents;
create policy pro_documents_delete_own
on public.pro_documents
for delete
to authenticated
using (profile_id = auth.uid());
