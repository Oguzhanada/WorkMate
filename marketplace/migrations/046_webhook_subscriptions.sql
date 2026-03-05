-- Migration 046: Webhook Subscriptions
-- Allows API key holders to subscribe to platform events and receive HTTP POST callbacks.

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  url         text not null,
  events      text[] not null,
  secret      text not null,  -- HMAC-SHA256 signing secret
  enabled     boolean not null default true,
  created_at  timestamp with time zone default now()
);

-- Index for event-based delivery queries
CREATE INDEX IF NOT EXISTS idx_webhook_subs_events ON webhook_subscriptions USING gin (events);
CREATE INDEX IF NOT EXISTS idx_webhook_subs_profile ON webhook_subscriptions (profile_id);

-- RLS
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their webhook subscriptions"
  ON webhook_subscriptions
  FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can view all webhook subscriptions"
  ON webhook_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    exists (
      select 1 from user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );
