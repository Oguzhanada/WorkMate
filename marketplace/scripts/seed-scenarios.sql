-- ============================================================
-- WorkMate — Supplemental Test Data: All Missing Scenarios
-- Run AFTER seed-test-data.sql (depends on those base IDs)
-- Re-runnable: cleanup section at top wipes this data first
-- ============================================================
-- ID key (new ranges):
--   pro_documents     : e1000000-0000-0000-0000-0000000000{01-40}
--   disputes          : f1000000-0000-0000-0000-0000000000{01-05}
--   job_messages      : 5a000000-0000-0000-0000-0000000000{01-18}
--   notifications     : 6a000000-0000-0000-0000-0000000000{01-25}
--   favourite_providers   : 7a000000-0000-0000-0000-0000000000{01-08}
--   referral_codes    : 8a000000-0000-0000-0000-0000000000{01-06}
--   referral_redemp.  : 9a000000-0000-0000-0000-0000000000{01-04}
--   quote (extra)     : c2000000-0000-0000-0000-0000000000{01-02}
-- ============================================================


-- ── 0. CLEANUP ────────────────────────────────────────────────
DELETE FROM public.referral_redemptions WHERE id::text LIKE 'k1000000%';
DELETE FROM public.referral_codes       WHERE id::text LIKE 'j1000000%';
DELETE FROM public.favourite_providers      WHERE id::text LIKE 'i1000000%';
DELETE FROM public.notifications        WHERE id::text LIKE 'h1000000%';
DELETE FROM public.job_messages         WHERE id::text LIKE 'g1000000%';
DELETE FROM public.disputes             WHERE id::text LIKE 'f1000000%';
DELETE FROM public.pro_documents        WHERE id::text LIKE 'e1000000%';
DELETE FROM public.quotes               WHERE id::text LIKE 'c2000000%';


-- ═══════════════════════════════════════════════════════════════
-- 15. PRO DOCUMENTS
-- ═══════════════════════════════════════════════════════════════
-- Verified providers: all 4 required docs, various statuses
-- Pattern: providers 01-05 fully verified, 06-08 mixed, 09-10 mostly pending
-- Incomplete providers: pending docs (awaiting admin review)

INSERT INTO public.pro_documents (
  id, profile_id, document_type, storage_path, verification_status,
  reviewed_by, reviewed_at, rejection_reason,
  expires_at, created_at
)
VALUES

  -- ── Provider 01 (Aoife Murphy) — fully verified, all 4 docs ──
  ('e1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   'id_verification',
   'providers/a1000000-01/id_verification.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'170 days',
   NULL, NULL,
   now()-interval'175 days'),

  ('e1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000001',
   'safe_pass',
   'providers/a1000000-01/safe_pass.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'169 days',
   NULL, now()+interval'18 months',
   now()-interval'175 days'),

  ('e1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000001',
   'public_liability_insurance',
   'providers/a1000000-01/pli.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'168 days',
   NULL, now()+interval'9 months',
   now()-interval'175 days'),

  ('e1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000001',
   'tax_clearance',
   'providers/a1000000-01/tax_clearance.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'167 days',
   NULL, now()+interval'6 months',
   now()-interval'175 days'),

  -- ── Provider 02 (Ciarán Kelly) — fully verified ──
  ('e1000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000002',
   'id_verification',
   'providers/a1000000-02/id_verification.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'155 days',
   NULL, NULL,
   now()-interval'158 days'),

  ('e1000000-0000-0000-0000-000000000006',
   'a1000000-0000-0000-0000-000000000002',
   'safe_pass',
   'providers/a1000000-02/safe_pass.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'154 days',
   NULL, now()+interval'14 months',
   now()-interval'158 days'),

  ('e1000000-0000-0000-0000-000000000007',
   'a1000000-0000-0000-0000-000000000002',
   'public_liability_insurance',
   'providers/a1000000-02/pli.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'153 days',
   NULL, now()+interval'10 months',
   now()-interval'158 days'),

  ('e1000000-0000-0000-0000-000000000008',
   'a1000000-0000-0000-0000-000000000002',
   'tax_clearance',
   'providers/a1000000-02/tax_clearance.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'152 days',
   NULL, now()+interval'4 months',
   now()-interval'158 days'),

  -- ── Provider 03 (Siobhán O Brien) — fully verified ──
  ('e1000000-0000-0000-0000-000000000009',
   'a1000000-0000-0000-0000-000000000003',
   'id_verification',
   'providers/a1000000-03/id_verification.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'135 days',
   NULL, NULL,
   now()-interval'138 days'),

  ('e1000000-0000-0000-0000-000000000010',
   'a1000000-0000-0000-0000-000000000003',
   'safe_pass',
   'providers/a1000000-03/safe_pass.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'134 days',
   NULL, now()+interval'22 months',
   now()-interval'138 days'),

  ('e1000000-0000-0000-0000-000000000011',
   'a1000000-0000-0000-0000-000000000003',
   'public_liability_insurance',
   'providers/a1000000-03/pli.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'133 days',
   NULL, now()+interval'11 months',
   now()-interval'138 days'),

  ('e1000000-0000-0000-0000-000000000012',
   'a1000000-0000-0000-0000-000000000003',
   'tax_clearance',
   'providers/a1000000-03/tax_clearance.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'132 days',
   NULL, now()+interval'8 months',
   now()-interval'138 days'),

  -- ── Provider 04 (Pádraig Walsh) — 3 verified, 1 pending ──
  ('e1000000-0000-0000-0000-000000000013',
   'a1000000-0000-0000-0000-000000000004',
   'id_verification',
   'providers/a1000000-04/id_verification.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'125 days',
   NULL, NULL,
   now()-interval'128 days'),

  ('e1000000-0000-0000-0000-000000000014',
   'a1000000-0000-0000-0000-000000000004',
   'safe_pass',
   'providers/a1000000-04/safe_pass.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'124 days',
   NULL, now()+interval'16 months',
   now()-interval'128 days'),

  ('e1000000-0000-0000-0000-000000000015',
   'a1000000-0000-0000-0000-000000000004',
   'public_liability_insurance',
   'providers/a1000000-04/pli.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'123 days',
   NULL, now()+interval'7 months',
   now()-interval'128 days'),

  ('e1000000-0000-0000-0000-000000000016',
   'a1000000-0000-0000-0000-000000000004',
   'tax_clearance',
   'providers/a1000000-04/tax_clearance_new.pdf',
   'pending',
   NULL, NULL,
   NULL, now()+interval'11 months',
   now()-interval'2 days'),  -- recently re-uploaded, awaiting review

  -- ── Provider 05 (Niamh Brennan) — fully verified ──
  ('e1000000-0000-0000-0000-000000000017',
   'a1000000-0000-0000-0000-000000000005',
   'id_verification',
   'providers/a1000000-05/id_verification.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'115 days',
   NULL, NULL,
   now()-interval'118 days'),

  ('e1000000-0000-0000-0000-000000000018',
   'a1000000-0000-0000-0000-000000000005',
   'safe_pass',
   'providers/a1000000-05/safe_pass.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'114 days',
   NULL, now()+interval'20 months',
   now()-interval'118 days'),

  ('e1000000-0000-0000-0000-000000000019',
   'a1000000-0000-0000-0000-000000000005',
   'public_liability_insurance',
   'providers/a1000000-05/pli.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'113 days',
   NULL, now()+interval'12 months',
   now()-interval'118 days'),

  ('e1000000-0000-0000-0000-000000000020',
   'a1000000-0000-0000-0000-000000000005',
   'tax_clearance',
   'providers/a1000000-05/tax_clearance.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'112 days',
   NULL, now()+interval'5 months',
   now()-interval'118 days'),

  -- ── Provider 06 (Seamus Fitzgerald) — 2 verified, 1 rejected, 1 pending ──
  ('e1000000-0000-0000-0000-000000000021',
   'a1000000-0000-0000-0000-000000000006',
   'id_verification',
   'providers/a1000000-06/id_verification.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'95 days',
   NULL, NULL,
   now()-interval'98 days'),

  ('e1000000-0000-0000-0000-000000000022',
   'a1000000-0000-0000-0000-000000000006',
   'safe_pass',
   'providers/a1000000-06/safe_pass.pdf',
   'verified',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'94 days',
   NULL, now()+interval'10 months',
   now()-interval'98 days'),

  ('e1000000-0000-0000-0000-000000000023',
   'a1000000-0000-0000-0000-000000000006',
   'public_liability_insurance',
   'providers/a1000000-06/pli_v1.pdf',
   'rejected',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'90 days',
   'Document is expired. Please upload a current certificate with at least 6 months remaining.',
   NULL,
   now()-interval'98 days'),

  ('e1000000-0000-0000-0000-000000000024',
   'a1000000-0000-0000-0000-000000000006',
   'public_liability_insurance',
   'providers/a1000000-06/pli_v2.pdf',
   'pending',
   NULL, NULL,
   NULL, now()+interval'11 months',
   now()-interval'3 days'),  -- re-submitted after rejection

  -- ── Provider 07 (Mairéad Ní Fhaoláin) — all pending (new) ──
  ('e1000000-0000-0000-0000-000000000025',
   'a1000000-0000-0000-0000-000000000007',
   'id_verification',
   'providers/a1000000-07/id_verification.pdf',
   'pending',
   NULL, NULL, NULL, NULL,
   now()-interval'5 days'),

  ('e1000000-0000-0000-0000-000000000026',
   'a1000000-0000-0000-0000-000000000007',
   'safe_pass',
   'providers/a1000000-07/safe_pass.pdf',
   'pending',
   NULL, NULL, NULL, now()+interval'24 months',
   now()-interval'5 days'),

  ('e1000000-0000-0000-0000-000000000027',
   'a1000000-0000-0000-0000-000000000007',
   'public_liability_insurance',
   'providers/a1000000-07/pli.pdf',
   'pending',
   NULL, NULL, NULL, now()+interval'12 months',
   now()-interval'5 days'),

  -- ── Incomplete provider 02 (Bríd Ní Dhochartaigh) — pending docs ──
  ('e1000000-0000-0000-0000-000000000028',
   'a2000000-0000-0000-0000-000000000002',
   'id_verification',
   'providers/a2000000-02/id_verification.pdf',
   'pending',
   NULL, NULL, NULL, NULL,
   now()-interval'40 days'),

  ('e1000000-0000-0000-0000-000000000029',
   'a2000000-0000-0000-0000-000000000002',
   'safe_pass',
   'providers/a2000000-02/safe_pass.pdf',
   'pending',
   NULL, NULL, NULL, now()+interval'18 months',
   now()-interval'40 days'),

  -- ── Incomplete provider 03 (Tomás Ó Treasaigh) — rejected docs ──
  ('e1000000-0000-0000-0000-000000000030',
   'a2000000-0000-0000-0000-000000000003',
   'id_verification',
   'providers/a2000000-03/id_photo.jpg',
   'rejected',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   now()-interval'50 days',
   'Photo is blurry and the document cannot be read clearly. Please re-upload a clear scan.',
   NULL,
   now()-interval'53 days');


-- ═══════════════════════════════════════════════════════════════
-- 16. DISPUTES
-- ═══════════════════════════════════════════════════════════════
-- Scenarios: open, under_review, resolved (admin ruling), cancelled

INSERT INTO public.disputes (
  id, job_id, created_by, status, dispute_type,
  customer_claim, provider_response, admin_notes,
  payment_status, resolution_deadline,
  resolved_at, resolved_by, resolution_type, resolution_amount_cents
)
VALUES

  -- dispute_01: open — Emma vs Aoife (job 01), quality issue
  ('f1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000001',
   'open',
   'quality_issue',
   'The bathroom was not cleaned to the standard agreed. Mould behind toilet not touched, grout still dirty.',
   NULL,
   NULL,
   'on_hold',
   now()+interval'5 days',
   NULL, NULL, NULL, NULL),

  -- dispute_02: under_review — Jack vs Ciarán (job 02), pricing
  ('f1000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000002',
   'a3000000-0000-0000-0000-000000000002',
   'under_review',
   'pricing_dispute',
   'Ciarán charged €30 extra for parts not included in the original quote. No prior notice given.',
   'The kitchen mixer required a non-standard fitting that was not specified in the job description. The extra cost was necessary and I informed the customer verbally on the day.',
   'Both parties have been notified. Awaiting receipts from provider for the additional parts.',
   'on_hold',
   now()+interval'3 days',
   NULL, NULL, NULL, NULL),

  -- dispute_03: resolved — admin sided with customer (full refund)
  ('f1000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000003',
   'resolved',
   'no_show',
   'Provider did not attend the scheduled date and did not contact me. I had to take a day off work.',
   'I had a family emergency and was unable to reach the customer. I apologise.',
   'Provider confirmed no-show due to personal circumstances. Customer had financial loss. Ruling: full refund to customer.',
   'refunded_to_customer',
   now()-interval'30 days',
   now()-interval'35 days',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   'full_refund', 16000),

  -- dispute_04: resolved — admin sided with provider (no refund)
  ('f1000000-0000-0000-0000-000000000004',
   'b1000000-0000-0000-0000-000000000004',
   'a3000000-0000-0000-0000-000000000005',
   'resolved',
   'quality_issue',
   'I am not happy with the paint finish in one bedroom. There are brush marks visible in certain lighting.',
   'The room was painted to a professional standard. Customer inspected and approved before I left. The marks mentioned are characteristic of the paint type the customer chose.',
   'Customer approved work on completion. Provider has photo evidence. Ruling: no refund. Customer may request touch-up at additional cost.',
   'released_to_provider',
   now()-interval'20 days',
   now()-interval'25 days',
   (SELECT id FROM public.profiles WHERE id::text LIKE 'a4%' LIMIT 1),
   'full_payment', NULL),

  -- dispute_05: cancelled — customer withdrew
  ('f1000000-0000-0000-0000-000000000005',
   'b1000000-0000-0000-0000-000000000006',
   'a3000000-0000-0000-0000-000000000007',
   'cancelled',
   'other',
   'Provider was 2 hours late without notification.',
   'There was heavy traffic. I did contact the customer but the message did not deliver.',
   NULL,
   'released_to_provider',
   now()-interval'10 days',
   now()-interval'12 days',
   NULL,
   NULL, NULL);


-- ═══════════════════════════════════════════════════════════════
-- 17. JOB MESSAGES
-- ═══════════════════════════════════════════════════════════════
-- Conversations on active/accepted/in_progress jobs
-- job b2000000-04 (accepted, wedding) — Meadhbh ↔ Mairéad
-- job b2000000-05 (in_progress, rewire) — Sinéad ↔ Siobhán
-- job b2000000-02 (quoted, garden) — Conor ↔ Aoife

INSERT INTO public.job_messages (
  id, job_id, quote_id, sender_id, receiver_id,
  visibility, message, created_at
)
VALUES

  -- ── Wedding job (b2000000-04): Meadhbh ↔ Mairéad ──
  ('5a000000-0000-0000-0000-000000000001',
   'b2000000-0000-0000-0000-000000000004',
   'c1000000-0000-0000-0000-000000000012',
   'a3000000-0000-0000-0000-000000000013',
   'a1000000-0000-0000-0000-000000000007',
   'public',
   'Hi Mairéad! So excited to work with you on the wedding. Can we schedule a call this week to go over the timeline?',
   now()-interval'9 days'),

  ('5a000000-0000-0000-0000-000000000002',
   'b2000000-0000-0000-0000-000000000004',
   'c1000000-0000-0000-0000-000000000012',
   'a1000000-0000-0000-0000-000000000007',
   'a3000000-0000-0000-0000-000000000013',
   'public',
   'Absolutely! I am free Thursday evening from 6pm or Friday morning from 10am. What suits you best?',
   now()-interval'9 days'+interval'2 hours'),

  ('5a000000-0000-0000-0000-000000000003',
   'b2000000-0000-0000-0000-000000000004',
   'c1000000-0000-0000-0000-000000000012',
   'a3000000-0000-0000-0000-000000000013',
   'a1000000-0000-0000-0000-000000000007',
   'public',
   'Thursday 6pm is perfect! I will send you a list of must-have shots in advance.',
   now()-interval'9 days'+interval'3 hours'),

  ('5a000000-0000-0000-0000-000000000004',
   'b2000000-0000-0000-0000-000000000004',
   'c1000000-0000-0000-0000-000000000012',
   'a1000000-0000-0000-0000-000000000007',
   'a3000000-0000-0000-0000-000000000013',
   'public',
   'Wonderful! One thing to note: the venue at Lough Cutra Castle has restrictions on drone usage — I will confirm with them but just wanted to flag it early.',
   now()-interval'8 days'),

  ('5a000000-0000-0000-0000-000000000005',
   'b2000000-0000-0000-0000-000000000004',
   'c1000000-0000-0000-0000-000000000012',
   'a3000000-0000-0000-0000-000000000013',
   'a1000000-0000-0000-0000-000000000007',
   'public',
   'Good to know! We were not planning on a drone anyway. What deposit do you need to secure the booking?',
   now()-interval'8 days'+interval'4 hours'),

  ('5a000000-0000-0000-0000-000000000006',
   'b2000000-0000-0000-0000-000000000004',
   'c1000000-0000-0000-0000-000000000012',
   'a1000000-0000-0000-0000-000000000007',
   'a3000000-0000-0000-0000-000000000013',
   'public',
   'We can arrange the deposit through WorkMate — 25% upfront with the remainder due one week before the date. I will send the contract details to your email.',
   now()-interval'7 days'),

  -- ── Rewire job (b2000000-05): Sinéad ↔ Siobhán ──
  ('5a000000-0000-0000-0000-000000000007',
   'b2000000-0000-0000-0000-000000000005',
   'c1000000-0000-0000-0000-000000000013',
   'a3000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003',
   'public',
   'Siobhán, just to confirm — you will be starting on Monday? I will make sure the house is clear from 8am.',
   now()-interval'8 days'),

  ('5a000000-0000-0000-0000-000000000008',
   'b2000000-0000-0000-0000-000000000005',
   'c1000000-0000-0000-0000-000000000013',
   'a1000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000003',
   'public',
   'Yes, Monday 8am sharp. I will have one assistant with me. Will need access to the attic and the utility room from day 1. Is the boiler area accessible?',
   now()-interval'8 days'+interval'1 hour'),

  ('5a000000-0000-0000-0000-000000000009',
   'b2000000-0000-0000-0000-000000000005',
   'c1000000-0000-0000-0000-000000000013',
   'a3000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003',
   'public',
   'Yes, the utility is unlocked. There is a bit of storage in front of the consumer unit, I will clear that before you arrive.',
   now()-interval'7 days'),

  ('5a000000-0000-0000-0000-000000000010',
   'b2000000-0000-0000-0000-000000000005',
   'c1000000-0000-0000-0000-000000000013',
   'a1000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000003',
   'public',
   'Brilliant. Day 1 update: first floor done, attic cabling replaced. Day 2 we will do ground floor and consumer unit swap. No issues so far.',
   now()-interval'6 days'),

  ('5a000000-0000-0000-0000-000000000011',
   'b2000000-0000-0000-0000-000000000005',
   'c1000000-0000-0000-0000-000000000013',
   'a3000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003',
   'public',
   'Great progress! Will you need me to be home on day 3 for the sign-off inspection?',
   now()-interval'5 days'),

  ('5a000000-0000-0000-0000-000000000012',
   'b2000000-0000-0000-0000-000000000005',
   'c1000000-0000-0000-0000-000000000013',
   'a1000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000003',
   'public',
   'Yes, I will need you there for the final test and handover. Certification will be emailed to you same day.',
   now()-interval'5 days'+interval'2 hours'),

  -- ── Garden job (b2000000-02): Conor ↔ Aoife ──
  ('5a000000-0000-0000-0000-000000000013',
   'b2000000-0000-0000-0000-000000000002',
   'c1000000-0000-0000-0000-000000000009',
   'a3000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000001',
   'public',
   'Hi Aoife, thanks for the quote! Quick question — can you also take away the old garden furniture, or is that extra?',
   now()-interval'2 days'),

  ('5a000000-0000-0000-0000-000000000014',
   'b2000000-0000-0000-0000-000000000002',
   'c1000000-0000-0000-0000-000000000009',
   'a1000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000004',
   'public',
   'I can take most garden waste but furniture would need a skip or separate collection. I have a contact who does single-item collections if that helps — usually €20-30 per item.',
   now()-interval'2 days'+interval'3 hours'),

  ('5a000000-0000-0000-0000-000000000015',
   'b2000000-0000-0000-0000-000000000002',
   'c1000000-0000-0000-0000-000000000009',
   'a3000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000001',
   'public',
   'Perfect, that works. Accepting your quote now. See you Saturday!',
   now()-interval'1 day');


-- ═══════════════════════════════════════════════════════════════
-- 18. NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════
-- Mix of read and unread for customers + providers

INSERT INTO public.notifications (
  id, user_id, type, payload, read_at, created_at
)
VALUES

  -- ── Customer Emma (a3-01): new quote on open job ──
  ('6a000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000001',
   'new_quote',
   '{"job_id":"b2000000-0000-0000-0000-000000000003","job_title":"Repaint exterior of semi-detached house","pro_name":"Pádraig Walsh","quote_amount_cents":45000}',
   NULL,
   now()-interval'4 days'),

  -- ── Customer Emma: job review approved ──
  ('6a000000-0000-0000-0000-000000000002',
   'a3000000-0000-0000-0000-000000000001',
   'job_review_approved',
   '{"job_id":"b2000000-0000-0000-0000-000000000003","job_title":"Repaint exterior of semi-detached house"}',
   now()-interval'4 days',
   now()-interval'5 days'),

  -- ── Customer Conor (a3-04): 2 quotes on garden job (unread) ──
  ('6a000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000004',
   'new_quote',
   '{"job_id":"b2000000-0000-0000-0000-000000000002","job_title":"Garden clearance and grass cutting","pro_name":"Aoife Murphy","quote_amount_cents":12000}',
   NULL,
   now()-interval'2 days'),

  ('6a000000-0000-0000-0000-000000000004',
   'a3000000-0000-0000-0000-000000000004',
   'new_quote',
   '{"job_id":"b2000000-0000-0000-0000-000000000002","job_title":"Garden clearance and grass cutting","pro_name":"Ciara Doyle","quote_amount_cents":14000}',
   NULL,
   now()-interval'1 day'),

  -- ── Customer Meadhbh (a3-13): quote accepted notification ──
  ('6a000000-0000-0000-0000-000000000005',
   'a3000000-0000-0000-0000-000000000013',
   'new_message',
   '{"job_id":"b2000000-0000-0000-0000-000000000004","job_title":"Wedding photographer + videographer","sender_name":"Mairéad Ní Fhaoláin"}',
   now()-interval'7 days',
   now()-interval'7 days'),

  -- ── Customer Sinéad (a3-03): in-progress update ──
  ('6a000000-0000-0000-0000-000000000006',
   'a3000000-0000-0000-0000-000000000003',
   'new_message',
   '{"job_id":"b2000000-0000-0000-0000-000000000005","job_title":"Full rewire — 3 bed house Dublin 14","sender_name":"Siobhán O Brien"}',
   NULL,
   now()-interval'5 days'),

  -- ── Provider Aoife (a1-01): new job lead ──
  ('6a000000-0000-0000-0000-000000000007',
   'a1000000-0000-0000-0000-000000000001',
   'new_job_lead',
   '{"job_id":"b2000000-0000-0000-0000-000000000003","title":"Repaint exterior of semi-detached house","county":"Dublin","budget_range":"€200-€500"}',
   NULL,
   now()-interval'5 days'),

  -- ── Provider Aoife: new message on garden job ──
  ('6a000000-0000-0000-0000-000000000008',
   'a1000000-0000-0000-0000-000000000001',
   'new_message',
   '{"job_id":"b2000000-0000-0000-0000-000000000002","job_title":"Garden clearance and grass cutting","sender_name":"Conor O Sullivan"}',
   now()-interval'2 days',
   now()-interval'2 days'),

  -- ── Provider Pádraig (a1-04): tax clearance doc pending (self-notification) ──
  ('6a000000-0000-0000-0000-000000000009',
   'a1000000-0000-0000-0000-000000000004',
   'admin_document_update',
   '{"document_type":"tax_clearance","decision":"pending","note":"Your updated Tax Clearance Certificate is under review."}',
   NULL,
   now()-interval'2 days'),

  -- ── Provider Siobhán (a1-03): new job lead ──
  ('6a000000-0000-0000-0000-000000000010',
   'a1000000-0000-0000-0000-000000000003',
   'new_job_lead',
   '{"job_id":"b2000000-0000-0000-0000-000000000001","title":"Emergency plumber needed — burst pipe in kitchen","county":"Galway","budget_range":"€0-€50"}',
   now()-interval'1 day',
   now()-interval'2 hours'),

  -- ── Provider Seamus (a1-06): PLI rejection notification ──
  ('6a000000-0000-0000-0000-000000000011',
   'a1000000-0000-0000-0000-000000000006',
   'admin_document_update',
   '{"document_type":"public_liability_insurance","decision":"rejected","note":"Document is expired. Please upload a current certificate with at least 6 months remaining."}',
   now()-interval'85 days',
   now()-interval'90 days'),

  -- ── Provider Seamus: PLI re-submitted pending ──
  ('6a000000-0000-0000-0000-000000000012',
   'a1000000-0000-0000-0000-000000000006',
   'admin_document_update',
   '{"document_type":"public_liability_insurance","decision":"pending","note":"Your updated Public Liability Insurance is under review."}',
   NULL,
   now()-interval'3 days'),

  -- ── Customer Emma: dispute opened notification ──
  ('6a000000-0000-0000-0000-000000000013',
   'a3000000-0000-0000-0000-000000000001',
   'dispute_opened',
   '{"dispute_id":"f1000000-0000-0000-0000-000000000001","job_title":"Deep clean 3-bed house before moving out"}',
   NULL,
   now()-interval'6 hours'),

  -- ── Provider Aoife: dispute opened on her job ──
  ('6a000000-0000-0000-0000-000000000014',
   'a1000000-0000-0000-0000-000000000001',
   'dispute_opened',
   '{"dispute_id":"f1000000-0000-0000-0000-000000000001","job_title":"Deep clean 3-bed house before moving out"}',
   NULL,
   now()-interval'6 hours'),

  -- ── Customer Jack (a3-02): dispute resolved (admin sided with customer) ──
  ('6a000000-0000-0000-0000-000000000015',
   'a3000000-0000-0000-0000-000000000002',
   'dispute_resolved',
   '{"dispute_id":"f1000000-0000-0000-0000-000000000002","job_title":"Fix leaking bathroom tap","resolution":"Dispute resolved. You will receive a full refund within 5 business days."}',
   now()-interval'34 days',
   now()-interval'35 days'),

  -- ── Provider Ciarán (a1-02): dispute resolved (admin notification) ──
  ('6a000000-0000-0000-0000-000000000016',
   'a1000000-0000-0000-0000-000000000002',
   'dispute_resolved',
   '{"dispute_id":"f1000000-0000-0000-0000-000000000002","job_title":"Fix leaking bathroom tap","resolution":"Dispute resolved in favour of customer. Payment has been refunded."}',
   now()-interval'34 days',
   now()-interval'35 days'),

  -- ── Payment release reminder to customer Sinéad ──
  ('6a000000-0000-0000-0000-000000000017',
   'a3000000-0000-0000-0000-000000000003',
   'payment_release_reminder',
   '{"job_id":"b2000000-0000-0000-0000-000000000005","job_title":"Full rewire — 3 bed house Dublin 14","provider_name":"Siobhán O Brien","amount_cents":120000}',
   NULL,
   now()-interval'1 day'),

  -- ── Verification update for incomplete provider Bríd ──
  ('6a000000-0000-0000-0000-000000000018',
   'a2000000-0000-0000-0000-000000000002',
   'admin_verification_update',
   '{"status":"pending","note":"Your documents have been received and are under review. We aim to process within 2 working days."}',
   NULL,
   now()-interval'38 days');


-- ═══════════════════════════════════════════════════════════════
-- 19. SAVED PROVIDERS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.favourite_providers (id, customer_id, provider_id, created_at)
VALUES
  -- Emma saved Aoife (cleaning), Siobhán (electrical)
  ('7a000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   now()-interval'58 days'),

  ('7a000000-0000-0000-0000-000000000002',
   'a3000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000003',
   now()-interval'30 days'),

  -- Jack saved Ciarán (plumbing)
  ('7a000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002',
   now()-interval'53 days'),

  -- Sinéad saved Siobhán (electrical), Pádraig (painting)
  ('7a000000-0000-0000-0000-000000000004',
   'a3000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003',
   now()-interval'48 days'),

  ('7a000000-0000-0000-0000-000000000005',
   'a3000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000004',
   now()-interval'20 days'),

  -- Aoife Byrne saved Niamh (moving)
  ('7a000000-0000-0000-0000-000000000006',
   'a3000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000005',
   now()-interval'88 days'),

  -- Conor saved Aoife (cleaning)
  ('7a000000-0000-0000-0000-000000000007',
   'a3000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000001',
   now()-interval'2 days'),

  -- Cian saved Diarmuid (tiling)
  ('7a000000-0000-0000-0000-000000000008',
   'a3000000-0000-0000-0000-000000000008',
   'a1000000-0000-0000-0000-000000000008',
   now()-interval'38 days')

ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- 20. REFERRAL CODES + REDEMPTIONS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.referral_codes (
  id, profile_id, code, uses_count, max_uses, created_at
)
VALUES
  -- Provider Aoife — high-use code
  ('8a000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   'AOIFE2026', 3, 20, now()-interval'90 days'),

  -- Provider Ciarán
  ('8a000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002',
   'CIARAN10', 1, 10, now()-interval'60 days'),

  -- Customer Emma
  ('8a000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000001',
   'EMMA25', 2, 10, now()-interval'45 days'),

  -- Customer Jack — unused code
  ('8a000000-0000-0000-0000-000000000004',
   'a3000000-0000-0000-0000-000000000002',
   'JACK2026', 0, 5, now()-interval'20 days'),

  -- Customer Sinéad — at max uses (full)
  ('8a000000-0000-0000-0000-000000000005',
   'a3000000-0000-0000-0000-000000000003',
   'SINEAD5', 5, 5, now()-interval'120 days'),

  -- Liam Sheridan — new provider
  ('8a000000-0000-0000-0000-000000000006',
   'a1000000-0000-0000-0000-000000000010',
   'LIAM2026', 0, 10, now()-interval'10 days')

ON CONFLICT DO NOTHING;


INSERT INTO public.referral_redemptions (
  id, referral_code_id, redeemed_by, created_at
)
VALUES
  -- Aoife's code redeemed by Conor
  ('9a000000-0000-0000-0000-000000000001',
   '8a000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000004',
   now()-interval'80 days'),

  -- Aoife's code redeemed by Caoimhe
  ('9a000000-0000-0000-0000-000000000002',
   '8a000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000007',
   now()-interval'50 days'),

  -- Aoife's code redeemed by Meadhbh
  ('9a000000-0000-0000-0000-000000000003',
   '8a000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000013',
   now()-interval'20 days'),

  -- Emma's code redeemed by Darragh
  ('9a000000-0000-0000-0000-000000000004',
   '8a000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000006',
   now()-interval'30 days')

ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION SUMMARY
-- ═══════════════════════════════════════════════════════════════
SELECT 'PRO DOCUMENTS'    AS category, COUNT(*) AS total FROM public.pro_documents    WHERE id::text LIKE 'e1000000%'
UNION ALL
SELECT 'DISPUTES',         COUNT(*) FROM public.disputes             WHERE id::text LIKE 'f1000000%'
UNION ALL
SELECT 'JOB MESSAGES',     COUNT(*) FROM public.job_messages         WHERE id::text LIKE 'g1000000%'
UNION ALL
SELECT 'NOTIFICATIONS',    COUNT(*) FROM public.notifications        WHERE id::text LIKE 'h1000000%'
UNION ALL
SELECT 'SAVED PROVIDERS',  COUNT(*) FROM public.favourite_providers      WHERE id::text LIKE 'i1000000%'
UNION ALL
SELECT 'REFERRAL CODES',   COUNT(*) FROM public.referral_codes       WHERE id::text LIKE 'j1000000%'
UNION ALL
SELECT 'REFERRAL REDEEM.', COUNT(*) FROM public.referral_redemptions WHERE id::text LIKE 'k1000000%';
