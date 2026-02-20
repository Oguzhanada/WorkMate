-- Storage setup for uploads (run in Supabase SQL Editor)

insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('pro-documents', 'pro-documents', false)
on conflict (id) do nothing;

-- Users can upload/list/delete only their own folder in job-photos bucket

drop policy if exists "job_photos_upload_own" on storage.objects;
create policy "job_photos_upload_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'job-photos'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "job_photos_select_own" on storage.objects;
create policy "job_photos_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'job-photos'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "job_photos_delete_own" on storage.objects;
create policy "job_photos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'job-photos'
  and split_part(name, '/', 2) = auth.uid()::text
);

-- Users can upload/list/delete only their own folder in pro-documents bucket

drop policy if exists "pro_docs_upload_own" on storage.objects;
create policy "pro_docs_upload_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pro-documents'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "pro_docs_select_own" on storage.objects;
create policy "pro_docs_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pro-documents'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "pro_docs_delete_own" on storage.objects;
create policy "pro_docs_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pro-documents'
  and split_part(name, '/', 2) = auth.uid()::text
);
