-- Provider credit system for quote submissions
-- Providers spend credits to submit quotes (Basic: 5 free/month, Pro: 25, Premium: 60)

CREATE TABLE IF NOT EXISTS public.provider_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider_id)
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = credit added, negative = credit spent
  reason TEXT NOT NULL CHECK (reason IN ('monthly_grant', 'purchase', 'quote_submitted', 'quote_refund', 'admin_adjustment')),
  reference_id UUID, -- quote_id or stripe_payment_intent_id
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_provider_credits_provider_id ON public.provider_credits (provider_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_provider_id ON public.credit_transactions (provider_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions (created_at DESC);

-- RLS
ALTER TABLE public.provider_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Providers can read their own balance
CREATE POLICY "provider_credits_read_own" ON public.provider_credits
  FOR SELECT USING (provider_id = auth.uid());

-- Providers can read their own transactions
CREATE POLICY "credit_transactions_read_own" ON public.credit_transactions
  FOR SELECT USING (provider_id = auth.uid());

-- Only service role can insert/update (via API)
CREATE POLICY "provider_credits_service_write" ON public.provider_credits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "credit_transactions_service_write" ON public.credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Monthly free credits by plan:
--   basic: 5 credits, professional: 25 credits, premium: 60 credits
-- Quote cost: 1 credit (normal), 2 credits (urgent/Quick Hire)
-- Credit packages sold separately (see pricing page)
