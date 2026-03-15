# Task Alerts RLS Smoke Checklist

- `task_alerts` table exists and policies are enabled.
- Customer can manage own alert preferences only.
- Provider reads only intended alert records.
- No broad allow-all policy is present.
- Match function route exists and can be invoked safely.
