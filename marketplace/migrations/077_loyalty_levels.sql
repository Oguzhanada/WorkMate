-- Loyalty level system for customers and providers
-- Updated by nightly cron based on jobs completed + ratings

-- Add loyalty_level to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS loyalty_level TEXT NOT NULL DEFAULT 'bronze'
    CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum', 'starter', 'trusted', 'expert', 'elite'));

-- Index for loyalty queries
CREATE INDEX IF NOT EXISTS idx_profiles_loyalty_level ON public.profiles (loyalty_level);

-- Customer loyalty levels:
--   bronze   → default (first job or new)
--   silver   → 5+ jobs completed, avg rating 4.0+
--   gold     → 15+ jobs completed, avg rating 4.0+
--   platinum → 30+ jobs completed, avg rating 4.0+

-- Provider loyalty levels:
--   starter  → new provider (default for verified_pro)
--   trusted  → 5+ jobs completed, avg rating 4.0+
--   expert   → 25+ jobs completed, avg rating 4.5+
--   elite    → 50+ jobs completed, avg rating 4.8+

-- Note: Admins can manually override loyalty_level via admin panel
