-- Storage RLS for the `job-files` bucket.
-- Apply in Supabase SQL Editor after creating the bucket in the dashboard.
--
-- Each file is uploaded to path: {jobId}/{timestamp}.{ext}
-- Access is restricted to: job customer, accepted-quote pro, and admin.

-- ── UPLOAD (INSERT): job participant only ──
create policy "job_files_insert_participants"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'job-files'
  and (
    -- Path starts with a valid job UUID that the user participates in
    exists (
      select 1 from public.jobs j
      where j.id::text = split_part(name, '/', 1)
        and (
          j.customer_id = auth.uid()
          or exists (
            select 1 from public.quotes q
            where q.id = j.accepted_quote_id
              and q.pro_id = auth.uid()
          )
        )
    )
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
);

-- ── READ (SELECT): job participant or admin ──
create policy "job_files_select_participants"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'job-files'
  and (
    exists (
      select 1 from public.jobs j
      where j.id::text = split_part(name, '/', 1)
        and (
          j.customer_id = auth.uid()
          or exists (
            select 1 from public.quotes q
            where q.id = j.accepted_quote_id
              and q.pro_id = auth.uid()
          )
        )
    )
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
);

-- ── DELETE: uploader (owner) or admin ──
create policy "job_files_delete_owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'job-files'
  and (
    owner = auth.uid()
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
);
