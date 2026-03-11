-- Extend dispute_type CHECK constraint with 4 new dispute types:
--   'no_show_provider' — provider didn't show up (mirrors legacy 'no_show')
--   'no_show_customer' — customer wasn't home at agreed time
--   'pricing_dispute'  — customer tried to renegotiate price at the door
--   'offline_payment'  — suspected platform bypass (paid outside platform)
-- The legacy 'no_show' value is retained for backward compatibility.

ALTER TABLE public.disputes
  DROP CONSTRAINT IF EXISTS disputes_dispute_type_check;

ALTER TABLE public.disputes
  ADD CONSTRAINT disputes_dispute_type_check
  CHECK (dispute_type IN (
    'quality_issue',
    'non_completion',
    'damage',
    'no_show',
    'no_show_provider',
    'no_show_customer',
    'pricing_dispute',
    'offline_payment',
    'other'
  ));
