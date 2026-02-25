-- Auto-delete job messages 1 year after job completion.
-- Uses a Supabase Edge Function endpoint + pg_cron scheduler.

create index if not exists idx_jobs_completed_marked_at
  on public.jobs(complete_marked_at)
  where status = 'completed';

-- Backfill historical rows once so retention can work for old completed jobs.
update public.jobs
set complete_marked_at = updated_at
where status = 'completed'
  and complete_marked_at is null;

create or replace function public.sync_complete_marked_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' and new.complete_marked_at is null then
    new.complete_marked_at = now();
  elsif old.status = 'completed' and new.status <> 'completed' then
    new.complete_marked_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_complete_marked_at on public.jobs;
create trigger trg_sync_complete_marked_at
before update on public.jobs
for each row execute function public.sync_complete_marked_at();

-- Optional auto-schedule:
-- Requires secrets in Supabase Vault:
--   message_retention_base_url = https://<PROJECT_REF>.supabase.co
--   message_retention_cron_secret = <same value as Edge Function CRON_SECRET env var>
do $$
declare
  base_url text;
  cron_secret text;
begin
  if to_regnamespace('cron') is null then
    raise notice 'Skipping message-retention cron setup: pg_cron extension is not enabled.';
    return;
  end if;

  if to_regnamespace('net') is null then
    raise notice 'Skipping message-retention cron setup: pg_net extension is not enabled.';
    return;
  end if;

  if to_regclass('vault.decrypted_secrets') is null then
    raise notice 'Skipping message-retention cron setup: vault extension is not enabled.';
    return;
  end if;

  select decrypted_secret
  into base_url
  from vault.decrypted_secrets
  where name = 'message_retention_base_url'
  limit 1;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'message_retention_cron_secret'
  limit 1;

  if coalesce(base_url, '') = '' or coalesce(cron_secret, '') = '' then
    raise notice 'Skipping message-retention cron setup: Vault secrets are missing.';
    return;
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'message-retention-daily';

  perform cron.schedule(
    'message-retention-daily',
    '15 3 * * *',
    format(
      $f$
      select
        net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', %L
          ),
          body := '{}'::jsonb
        ) as request_id;
      $f$,
      base_url || '/functions/v1/message-retention',
      'Bearer ' || cron_secret
    )
  );

  raise notice 'Scheduled cron job: message-retention-daily';
end $$;
