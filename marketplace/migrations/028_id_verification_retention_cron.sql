-- ID verification retention logs + daily cron trigger for edge function

create table if not exists public.id_verification_retention_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  document_path text,
  result text not null default 'success',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_id_verification_retention_logs_created_at
  on public.id_verification_retention_logs(created_at desc);

alter table public.id_verification_retention_logs enable row level security;

drop policy if exists id_verification_retention_logs_select_admin on public.id_verification_retention_logs;
create policy id_verification_retention_logs_select_admin
on public.id_verification_retention_logs
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

do $$
declare
  base_url text;
  cron_secret text;
begin
  if to_regnamespace('cron') is null then
    raise notice 'Skipping id-verification retention cron setup: pg_cron extension is not enabled.';
    return;
  end if;

  if to_regnamespace('net') is null then
    raise notice 'Skipping id-verification retention cron setup: pg_net extension is not enabled.';
    return;
  end if;

  if to_regnamespace('vault') is null then
    raise notice 'Skipping id-verification retention cron setup: vault extension is not enabled.';
    return;
  end if;

  select decrypted_secret into base_url
  from vault.decrypted_secrets
  where name = 'project_url'
  limit 1;

  select decrypted_secret into cron_secret
  from vault.decrypted_secrets
  where name = 'id_verification_retention_cron_secret'
  limit 1;

  if coalesce(base_url, '') = '' or coalesce(cron_secret, '') = '' then
    raise notice 'Skipping id-verification retention cron setup: Vault secrets are missing.';
    return;
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'id-verification-retention-daily';

  perform cron.schedule(
    'id-verification-retention-daily',
    '30 2 * * *',
    format(
      $job$
      select
        net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', %L
          ),
          body := '{}'::jsonb
        ) as request_id;
      $job$,
      base_url || '/functions/v1/id-verification-retention',
      'Bearer ' || cron_secret
    )
  );
end $$;
