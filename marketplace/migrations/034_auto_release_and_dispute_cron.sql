-- Daily cron jobs for auto-release payments and stale dispute escalation.

do $$
declare
  base_url text;
  cron_secret text;
begin
  if to_regnamespace('cron') is null then
    raise notice 'Skipping cron setup: pg_cron extension is not enabled.';
    return;
  end if;

  if to_regnamespace('net') is null then
    raise notice 'Skipping cron setup: pg_net extension is not enabled.';
    return;
  end if;

  if to_regnamespace('vault') is null then
    raise notice 'Skipping cron setup: vault extension is not enabled.';
    return;
  end if;

  select decrypted_secret into base_url
  from vault.decrypted_secrets
  where name = 'project_url'
  limit 1;

  select decrypted_secret into cron_secret
  from vault.decrypted_secrets
  where name = 'CRON_SECRET'
  limit 1;

  if coalesce(base_url, '') = '' or coalesce(cron_secret, '') = '' then
    raise notice 'Skipping cron setup: project_url or CRON_SECRET is missing in Vault secrets.';
    return;
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'auto-release-payments-daily';

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'escalate-stale-disputes-daily';

  perform cron.schedule(
    'auto-release-payments-daily',
    '15 3 * * *',
    format(
      $job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', %L
        ),
        body := '{}'::jsonb
      ) as request_id;
      $job$,
      base_url || '/functions/v1/auto-release-payments',
      'Bearer ' || cron_secret
    )
  );

  perform cron.schedule(
    'escalate-stale-disputes-daily',
    '30 3 * * *',
    format(
      $job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', %L
        ),
        body := '{}'::jsonb
      ) as request_id;
      $job$,
      base_url || '/functions/v1/escalate-stale-disputes',
      'Bearer ' || cron_secret
    )
  );
end $$;
