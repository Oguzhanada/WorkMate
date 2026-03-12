-- ============================================================
-- WorkMate — Comprehensive Test Data Seed
-- Run in: Supabase SQL Editor (service_role context; RLS bypassed)
-- Re-runnable: DELETE section at top wipes all test accounts first
-- Password for all test accounts: TestPass123!
-- ============================================================
-- ID key:
--   Verified providers : a1000000-0000-0000-0000-0000000000{01-10}
--   Incomplete providers: a2000000-0000-0000-0000-0000000000{01-10}
--   Customers           : a3000000-0000-0000-0000-0000000000{01-15}
--   Completed jobs      : b1000000-0000-0000-0000-0000000000{01-08}
--   Open/active jobs    : b2000000-0000-0000-0000-0000000000{01-06}
--   Quotes              : c1000000-0000-0000-0000-0000000000{01-14}
--   Reviews             : d1000000-0000-0000-0000-0000000000{01-08}
-- ============================================================


-- ── 0. CLEANUP ──────────────────────────────────────────────
-- Deletes all test accounts + cascade-deletes child records
DELETE FROM auth.users WHERE id::text LIKE 'a1000000%'
                          OR id::text LIKE 'a2000000%'
                          OR id::text LIKE 'a3000000%';


-- ── 1. AUTH USERS ────────────────────────────────────────────
-- Inserting triggers handle_new_user → creates profiles + addresses + user_roles

-- ╔══════════════════════════════════════════════════════════╗
-- ║  VERIFIED PROVIDERS (10) — complete profiles             ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
VALUES
  -- 1. Aoife Murphy — Home Cleaning — Dublin — elite — premium
  ('a1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','aoife.murphy@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Aoife Murphy","role":"verified_pro","phone":"+353861234501",
     "eircode":"D01A4X0","address_line_1":"14 O Connell Street","locality":"Dublin 1","county":"Dublin"}',
   now()-interval'180 days', now()-interval'180 days', false,'','','',''),

  -- 2. Ciarán Kelly — Plumbing Repair — Cork — elite — premium
  ('a1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','ciaran.kelly@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Ciarán Kelly","role":"verified_pro","phone":"+353861234502",
     "eircode":"T12K2D9","address_line_1":"5 Patrick Street","locality":"Cork City","county":"Cork"}',
   now()-interval'160 days', now()-interval'160 days', false,'','','',''),

  -- 3. Siobhán O Brien — Electrical Repair — Galway — expert — professional
  ('a1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','siobhan.obrien@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Siobhán O Brien","role":"verified_pro","phone":"+353861234503",
     "eircode":"H91AY93","address_line_1":"22 Eyre Square","locality":"Galway City","county":"Galway"}',
   now()-interval'140 days', now()-interval'140 days', false,'','','',''),

  -- 4. Pádraig Walsh — Painting & Decorating — Dublin — expert — professional
  ('a1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','padraig.walsh@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Pádraig Walsh","role":"verified_pro","phone":"+353861234504",
     "eircode":"D02F267","address_line_1":"8 Grafton Street","locality":"Dublin 2","county":"Dublin"}',
   now()-interval'130 days', now()-interval'130 days', false,'','','',''),

  -- 5. Niamh Brennan — Local Moving — Limerick — expert — professional
  ('a1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','niamh.brennan@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Niamh Brennan","role":"verified_pro","phone":"+353861234505",
     "eircode":"V94K2HT","address_line_1":"3 O Connell Avenue","locality":"Limerick City","county":"Limerick"}',
   now()-interval'120 days', now()-interval'120 days', false,'','','',''),

  -- 6. Seamus Fitzgerald — Math Tutoring — Dublin — trusted — basic
  ('a1000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','seamus.fitzgerald@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Seamus Fitzgerald","role":"verified_pro","phone":"+353861234506",
     "eircode":"D04C3W2","address_line_1":"45 Merrion Square","locality":"Dublin 4","county":"Dublin"}',
   now()-interval'100 days', now()-interval'100 days', false,'','','',''),

  -- 7. Mairéad Ní Fhaoláin — Wedding Planning — Cork — trusted — basic
  ('a1000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','mairead.nifhaolain@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Mairéad Ní Fhaoláin","role":"verified_pro","phone":"+353861234507",
     "eircode":"T23A8B7","address_line_1":"12 Grand Parade","locality":"Cork City","county":"Cork"}',
   now()-interval'90 days', now()-interval'90 days', false,'','','',''),

  -- 8. Diarmuid Riordan — Tiling — Waterford — trusted — basic
  ('a1000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','diarmuid.riordan@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Diarmuid Riordan","role":"verified_pro","phone":"+353861234508",
     "eircode":"X91WH43","address_line_1":"6 The Quay","locality":"Waterford City","county":"Waterford"}',
   now()-interval'80 days', now()-interval'80 days', false,'','','',''),

  -- 9. Ciara Doyle — Office Cleaning — Kilkenny — starter — basic
  ('a1000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','ciara.doyle@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Ciara Doyle","role":"verified_pro","phone":"+353861234509",
     "eircode":"R95AK23","address_line_1":"9 High Street","locality":"Kilkenny City","county":"Kilkenny"}',
   now()-interval'30 days', now()-interval'30 days', false,'','','',''),

  -- 10. Liam Sheridan — Birthday Planning — Sligo — starter — basic
  ('a1000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','liam.sheridan@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Liam Sheridan","role":"verified_pro","phone":"+353861234510",
     "eircode":"F91PH93","address_line_1":"2 Wine Street","locality":"Sligo Town","county":"Sligo"}',
   now()-interval'14 days', now()-interval'14 days', false,'','','','');


-- ╔══════════════════════════════════════════════════════════╗
-- ║  INCOMPLETE / UNVERIFIED PROVIDERS (10)                  ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
VALUES
  -- 11. Rónán Mac Cormaic — unverified, no phone, no docs
  ('a2000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','ronan.maccormaic@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Rónán Mac Cormaic","role":"verified_pro"}',
   now()-interval'60 days', now()-interval'60 days', false,'','','',''),

  -- 12. Bríd Ní Dhochartaigh — pending (docs submitted, awaiting admin review)
  ('a2000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','brid.nidhochartaigh@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Bríd Ní Dhochartaigh","role":"verified_pro","phone":"+353861234512",
     "eircode":"D06EX09","address_line_1":"33 Rathmines Road","locality":"Dublin 6","county":"Dublin"}',
   now()-interval'45 days', now()-interval'45 days', false,'','','',''),

  -- 13. Tomás Ó Treasaigh — rejected (docs failed admin review)
  ('a2000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','tomas.otreasoigh@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Tomás Ó Treasaigh","role":"verified_pro","phone":"+353861234513",
     "eircode":"D08KW12","address_line_1":"17 Thomas Street","locality":"Dublin 8","county":"Dublin"}',
   now()-interval'55 days', now()-interval'55 days', false,'','','',''),

  -- 14. Sarah Lynch — pending, no phone number
  ('a2000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','sarah.lynch@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Sarah Lynch","role":"verified_pro"}',
   now()-interval'40 days', now()-interval'40 days', false,'','','',''),

  -- 15. James Murphy — unverified, barely started
  ('a2000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','james.murphy@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"James Murphy","role":"verified_pro"}',
   now()-interval'5 days', now()-interval'5 days', false,'','','',''),

  -- 16. Aoife Ní Cheallaigh — pending, missing insurance doc
  ('a2000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','aoife.nicheallaigh@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Aoife Ní Cheallaigh","role":"verified_pro","phone":"+353861234516",
     "eircode":"K32EH45","address_line_1":"8 Main Street","locality":"Naas","county":"Kildare"}',
   now()-interval'35 days', now()-interval'35 days', false,'','','',''),

  -- 17. Colm Breathnach — unverified, no services added
  ('a2000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','colm.breathnach@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Colm Breathnach","role":"verified_pro","phone":"+353861234517",
     "eircode":"H14PK23","address_line_1":"5 Shop Street","locality":"Galway City","county":"Galway"}',
   now()-interval'25 days', now()-interval'25 days', false,'','','',''),

  -- 18. Deirdre Ní Mhaolaígh — rejected, Stripe not connected
  ('a2000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','deirdre.nimhaolaigh@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Deirdre Ní Mhaolaígh","role":"verified_pro","phone":"+353861234518",
     "eircode":"A67XH23","address_line_1":"21 Wicklow Town Road","locality":"Wicklow Town","county":"Wicklow"}',
   now()-interval'50 days', now()-interval'50 days', false,'','','',''),

  -- 19. Fionnuala Ní Dhonncha — pending, no service areas set
  ('a2000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','fionnuala.nidhonncha@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Fionnuala Ní Dhonncha","role":"verified_pro","phone":"+353861234519",
     "eircode":"Y35EX12","address_line_1":"4 Main Street","locality":"Wexford Town","county":"Wexford"}',
   now()-interval'20 days', now()-interval'20 days', false,'','','',''),

  -- 20. Cillian Ó Méachair — unverified, step 1 only
  ('a2000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','cillian.omeachair@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Cillian Ó Méachair","role":"verified_pro"}',
   now()-interval'3 days', now()-interval'3 days', false,'','','','');


-- ╔══════════════════════════════════════════════════════════╗
-- ║  CUSTOMERS (15)                                          ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
VALUES
  -- 21. Emma Walsh — 3 completed jobs, 3 reviews given
  ('a3000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','emma.walsh@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Emma Walsh","phone":"+353861234601",
     "eircode":"D12P5HX","address_line_1":"55 Sundrive Road","locality":"Dublin 12","county":"Dublin"}',
   now()-interval'150 days', now()-interval'150 days', false,'','','',''),

  -- 22. Jack O Connor — 2 completed jobs, 2 reviews
  ('a3000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','jack.oconnor@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Jack O Connor","phone":"+353861234602",
     "eircode":"T12HK42","address_line_1":"8 South Mall","locality":"Cork City","county":"Cork"}',
   now()-interval'130 days', now()-interval'130 days', false,'','','',''),

  -- 23. Sinéad Murphy — 1 in_progress job, 1 completed, 1 review
  ('a3000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','sinead.murphy@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Sinéad Murphy","phone":"+353861234603",
     "eircode":"D14FV29","address_line_1":"12 Clonskeagh Road","locality":"Dublin 14","county":"Dublin"}',
   now()-interval'110 days', now()-interval'110 days', false,'','','',''),

  -- 24. Conor Ryan — 2 open jobs, no history
  ('a3000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','conor.ryan@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Conor Ryan","phone":"+353861234604",
     "eircode":"H91AY93","address_line_1":"3 Taylor Hill","locality":"Galway City","county":"Galway"}',
   now()-interval'30 days', now()-interval'30 days', false,'','','',''),

  -- 25. Aoife Byrne — 4 completed jobs, 4 reviews (gold loyalty)
  ('a3000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','aoife.byrne@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Aoife Byrne","phone":"+353861234605",
     "eircode":"D18AH26","address_line_1":"9 Stillorgan Road","locality":"Dublin 18","county":"Dublin"}',
   now()-interval'200 days', now()-interval'200 days', false,'','','',''),

  -- 26. Darragh O Sullivan — 1 open job
  ('a3000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','darragh.osullivan@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Darragh O Sullivan","phone":"+353861234606",
     "eircode":"V94K2HT","address_line_1":"19 O Connell Street","locality":"Limerick City","county":"Limerick"}',
   now()-interval'20 days', now()-interval'20 days', false,'','','',''),

  -- 27. Caoimhe Ní Dhonncha — 1 completed, 1 review
  ('a3000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','caoimhe.nidhonncha@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Caoimhe Ní Dhonncha","phone":"+353861234607",
     "eircode":"F91PH93","address_line_1":"7 Castle Street","locality":"Sligo Town","county":"Sligo"}',
   now()-interval'90 days', now()-interval'90 days', false,'','','',''),

  -- 28. Cian McCarthy — 1 open, 2 completed, 2 reviews
  ('a3000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','cian.mccarthy@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Cian McCarthy","phone":"+353861234608",
     "eircode":"X91WH43","address_line_1":"11 Manor Street","locality":"Waterford City","county":"Waterford"}',
   now()-interval'120 days', now()-interval'120 days', false,'','','',''),

  -- 29. Aisling Daly — inactive, no jobs
  ('a3000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','aisling.daly@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Aisling Daly","phone":"+353861234609",
     "eircode":"R95AK23","address_line_1":"3 Parliament Street","locality":"Kilkenny City","county":"Kilkenny"}',
   now()-interval'60 days', now()-interval'60 days', false,'','','',''),

  -- 30. Fiachra Brennan — inactive, no jobs
  ('a3000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','fiachra.brennan@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Fiachra Brennan","phone":"+353861234610",
     "eircode":"D02F267","address_line_1":"6 Parnell Street","locality":"Dublin 1","county":"Dublin"}',
   now()-interval'10 days', now()-interval'10 days', false,'','','',''),

  -- 31. Sorcha Ní Mhurchú — 1 quoted job, 1 completed, 1 review
  ('a3000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','sorcha.nimhurchu@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Sorcha Ní Mhurchú","phone":"+353861234611",
     "eircode":"D01A4X0","address_line_1":"22 North Circular Road","locality":"Dublin 1","county":"Dublin"}',
   now()-interval'100 days', now()-interval'100 days', false,'','','',''),

  -- 32. Tadhg O Brien — 2 completed, 2 reviews (silver loyalty)
  ('a3000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','tadhg.obrien@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Tadhg O Brien","phone":"+353861234612",
     "eircode":"T23A8B7","address_line_1":"14 Douglas Street","locality":"Cork City","county":"Cork"}',
   now()-interval'140 days', now()-interval'140 days', false,'','','',''),

  -- 33. Meadhbh Ní Fhaoláin — 1 accepted job (awaiting payment)
  ('a3000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','meadhbh.nifhaolain@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Meadhbh Ní Fhaoláin","phone":"+353861234613",
     "eircode":"H14PK23","address_line_1":"1 Eyre Square","locality":"Galway City","county":"Galway"}',
   now()-interval'45 days', now()-interval'45 days', false,'','','',''),

  -- 34. Ruairí Mac Aonghusa — 1 completed, 1 review
  ('a3000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','ruairi.macanghusa@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Ruairí Mac Aonghusa","phone":"+353861234614",
     "eircode":"K32EH45","address_line_1":"30 Main Street","locality":"Naas","county":"Kildare"}',
   now()-interval'80 days', now()-interval'80 days', false,'','','',''),

  -- 35. Orla Flanagan — 1 open job
  ('a3000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','orla.flanagan@workmate-test.ie',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Orla Flanagan","phone":"+353861234615",
     "eircode":"W23V2K7","address_line_1":"5 Athlone Road","locality":"Athlone","county":"Westmeath"}',
   now()-interval'7 days', now()-interval'7 days', false,'','','','');


-- ── 1b. AUTH IDENTITIES ──────────────────────────────────────
-- GoTrue requires an auth.identities row per user for email/password login.
-- Must run AFTER the auth.users inserts above.
-- IMPORTANT: confirmation_token / recovery_token / email_change / email_change_token_new
--            must be '' (empty string) in auth.users — NOT NULL.
--            GoTrue scans them as non-nullable strings and crashes with
--            "converting NULL to string is unsupported" on login.
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.email,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(),
  u.created_at,
  now()
FROM auth.users u
WHERE u.email LIKE '%workmate-test.ie'
ON CONFLICT DO NOTHING;


-- ── 2. UPDATE PROFILES — Verified Providers ──────────────────
-- Set is_verified, verification_status, loyalty_level, id_verification_status, county
UPDATE public.profiles SET
  is_verified            = true,
  verification_status    = 'verified',
  id_verification_status = 'approved',
  id_verification_submitted_at = created_at + interval'2 days',
  id_verification_reviewed_at  = created_at + interval'4 days',
  loyalty_level          = 'elite',
  county                 = 'Dublin',
  locality               = 'Dublin 1',
  terms_version          = '1.0',
  terms_accepted_at      = created_at + interval'1 hour',
  insurance_expiry_date  = (now() + interval'1 year')::date
WHERE id = 'a1000000-0000-0000-0000-000000000001';

UPDATE public.profiles SET
  is_verified            = true,
  verification_status    = 'verified',
  id_verification_status = 'approved',
  id_verification_submitted_at = created_at + interval'2 days',
  id_verification_reviewed_at  = created_at + interval'4 days',
  loyalty_level          = 'elite',
  county                 = 'Cork',
  locality               = 'Cork City',
  terms_version          = '1.0',
  terms_accepted_at      = created_at + interval'1 hour',
  insurance_expiry_date  = (now() + interval'1 year')::date
WHERE id = 'a1000000-0000-0000-0000-000000000002';

UPDATE public.profiles SET
  is_verified            = true,
  verification_status    = 'verified',
  id_verification_status = 'approved',
  id_verification_submitted_at = created_at + interval'2 days',
  id_verification_reviewed_at  = created_at + interval'4 days',
  loyalty_level          = 'expert',
  county                 = 'Galway',
  locality               = 'Galway City',
  terms_version          = '1.0',
  terms_accepted_at      = created_at + interval'1 hour',
  insurance_expiry_date  = (now() + interval'9 months')::date
WHERE id = 'a1000000-0000-0000-0000-000000000003';

UPDATE public.profiles SET
  is_verified            = true,
  verification_status    = 'verified',
  id_verification_status = 'approved',
  id_verification_submitted_at = created_at + interval'2 days',
  id_verification_reviewed_at  = created_at + interval'4 days',
  loyalty_level          = 'expert',
  county                 = 'Dublin',
  locality               = 'Dublin 2',
  terms_version          = '1.0',
  terms_accepted_at      = created_at + interval'1 hour',
  insurance_expiry_date  = (now() + interval'8 months')::date
WHERE id = 'a1000000-0000-0000-0000-000000000004';

UPDATE public.profiles SET
  is_verified            = true,
  verification_status    = 'verified',
  id_verification_status = 'approved',
  id_verification_submitted_at = created_at + interval'2 days',
  id_verification_reviewed_at  = created_at + interval'4 days',
  loyalty_level          = 'expert',
  county                 = 'Limerick',
  locality               = 'Limerick City',
  terms_version          = '1.0',
  terms_accepted_at      = created_at + interval'1 hour',
  insurance_expiry_date  = (now() + interval'11 months')::date
WHERE id = 'a1000000-0000-0000-0000-000000000005';

UPDATE public.profiles SET
  is_verified = true, verification_status = 'verified',
  id_verification_status = 'approved', loyalty_level = 'trusted',
  county = 'Dublin', locality = 'Dublin 4',
  terms_version = '1.0', terms_accepted_at = created_at + interval'1 hour'
WHERE id = 'a1000000-0000-0000-0000-000000000006';

UPDATE public.profiles SET
  is_verified = true, verification_status = 'verified',
  id_verification_status = 'approved', loyalty_level = 'trusted',
  county = 'Cork', locality = 'Cork City',
  terms_version = '1.0', terms_accepted_at = created_at + interval'1 hour'
WHERE id = 'a1000000-0000-0000-0000-000000000007';

UPDATE public.profiles SET
  is_verified = true, verification_status = 'verified',
  id_verification_status = 'approved', loyalty_level = 'trusted',
  county = 'Waterford', locality = 'Waterford City',
  terms_version = '1.0', terms_accepted_at = created_at + interval'1 hour'
WHERE id = 'a1000000-0000-0000-0000-000000000008';

UPDATE public.profiles SET
  is_verified = true, verification_status = 'verified',
  id_verification_status = 'approved', loyalty_level = 'starter',
  county = 'Kilkenny', locality = 'Kilkenny City',
  terms_version = '1.0', terms_accepted_at = created_at + interval'1 hour'
WHERE id = 'a1000000-0000-0000-0000-000000000009';

UPDATE public.profiles SET
  is_verified = true, verification_status = 'verified',
  id_verification_status = 'approved', loyalty_level = 'starter',
  county = 'Sligo', locality = 'Sligo Town',
  terms_version = '1.0', terms_accepted_at = created_at + interval'1 hour'
WHERE id = 'a1000000-0000-0000-0000-000000000010';


-- ── 3. UPDATE PROFILES — Incomplete Providers ─────────────────
-- ip11: unverified, no update needed (trigger defaults are correct)
-- ip12: pending docs
UPDATE public.profiles SET
  verification_status = 'pending',
  id_verification_status = 'pending',
  id_verification_submitted_at = created_at + interval'3 days',
  county = 'Dublin', locality = 'Dublin 6',
  terms_version = '1.0', terms_accepted_at = created_at + interval'2 hours'
WHERE id = 'a2000000-0000-0000-0000-000000000002';

-- ip13: rejected
UPDATE public.profiles SET
  verification_status = 'rejected',
  id_verification_status = 'rejected',
  id_verification_submitted_at = created_at + interval'2 days',
  id_verification_reviewed_at  = created_at + interval'5 days',
  id_verification_rejected_reason = 'ID document image was blurry and unreadable. Please resubmit a clear photo.',
  county = 'Dublin', locality = 'Dublin 8'
WHERE id = 'a2000000-0000-0000-0000-000000000003';

-- ip14: pending, no phone (already set in trigger from meta)
UPDATE public.profiles SET
  verification_status = 'pending',
  id_verification_status = 'pending',
  id_verification_submitted_at = created_at + interval'1 day'
WHERE id = 'a2000000-0000-0000-0000-000000000004';

-- ip16: pending, missing insurance
UPDATE public.profiles SET
  verification_status = 'pending',
  id_verification_status = 'approved',
  id_verification_submitted_at = created_at + interval'2 days',
  county = 'Kildare', locality = 'Naas',
  terms_version = '1.0', terms_accepted_at = created_at + interval'1 hour'
WHERE id = 'a2000000-0000-0000-0000-000000000006';

-- ip18: rejected, Stripe not set up
UPDATE public.profiles SET
  verification_status = 'rejected',
  id_verification_status = 'pending',
  id_verification_submitted_at = created_at + interval'2 days',
  county = 'Wicklow', locality = 'Wicklow Town',
  id_verification_rejected_reason = 'Stripe Connect account not completed. Please finish Stripe onboarding.',
  terms_version = '1.0', terms_accepted_at = created_at + interval'1 hour'
WHERE id = 'a2000000-0000-0000-0000-000000000008';

-- ip19: pending, no service areas
UPDATE public.profiles SET
  verification_status = 'pending',
  id_verification_status = 'approved',
  id_verification_submitted_at = created_at + interval'1 day',
  county = 'Wexford', locality = 'Wexford Town',
  terms_version = '1.0', terms_accepted_at = created_at + interval'1 hour'
WHERE id = 'a2000000-0000-0000-0000-000000000009';


-- ── 4. UPDATE PROFILES — Customers ───────────────────────────
-- Set loyalty levels for active customers
UPDATE public.profiles SET loyalty_level = 'gold'   WHERE id = 'a3000000-0000-0000-0000-000000000005'; -- Aoife Byrne (4 jobs)
UPDATE public.profiles SET loyalty_level = 'silver'  WHERE id = 'a3000000-0000-0000-0000-000000000001'; -- Emma Walsh (3 jobs)
UPDATE public.profiles SET loyalty_level = 'silver'  WHERE id = 'a3000000-0000-0000-0000-000000000012'; -- Tadhg O Brien
UPDATE public.profiles SET loyalty_level = 'silver'  WHERE id = 'a3000000-0000-0000-0000-000000000008'; -- Cian McCarthy


-- ── 5. USER ROLES — verified_pro ─────────────────────────────
-- Trigger only adds 'customer'; manually add 'verified_pro' for all provider profiles
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT id, 'verified_pro', created_at, created_at
FROM public.profiles
WHERE id IN (
  'a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000010',
  'a2000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000002',
  'a2000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000004',
  'a2000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000006',
  'a2000000-0000-0000-0000-000000000007','a2000000-0000-0000-0000-000000000008',
  'a2000000-0000-0000-0000-000000000009','a2000000-0000-0000-0000-000000000010'
)
ON CONFLICT (user_id, role) DO NOTHING;


-- ── 6. PRO SERVICES ──────────────────────────────────────────
-- Link each verified provider to 1-2 service categories

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000001', id FROM public.categories WHERE slug = 'home-cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000001', id FROM public.categories WHERE slug = 'office-cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000002', id FROM public.categories WHERE slug = 'plumbing-repair'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000003', id FROM public.categories WHERE slug = 'electrical-repair'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000004', id FROM public.categories WHERE slug = 'painting-decorating'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000005', id FROM public.categories WHERE slug = 'local-moving'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000005', id FROM public.categories WHERE slug = 'intercity-moving'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000006', id FROM public.categories WHERE slug = 'math-tutoring'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000007', id FROM public.categories WHERE slug = 'wedding-planning'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000008', id FROM public.categories WHERE slug = 'tiling'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000009', id FROM public.categories WHERE slug = 'office-cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a1000000-0000-0000-0000-000000000010', id FROM public.categories WHERE slug = 'birthday-planning'
ON CONFLICT DO NOTHING;

-- Incomplete providers: some have partial services
INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a2000000-0000-0000-0000-000000000002', id FROM public.categories WHERE slug = 'home-cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a2000000-0000-0000-0000-000000000006', id FROM public.categories WHERE slug = 'electrical-repair'
ON CONFLICT DO NOTHING;

INSERT INTO public.pro_services (profile_id, category_id)
SELECT 'a2000000-0000-0000-0000-000000000009', id FROM public.categories WHERE slug = 'painting-decorating'
ON CONFLICT DO NOTHING;
-- ip17 (Colm Breathnach) intentionally has NO services — tests empty state


-- ── 7. PRO SERVICE AREAS ─────────────────────────────────────
INSERT INTO public.pro_service_areas (profile_id, county)
VALUES
  ('a1000000-0000-0000-0000-000000000001','Dublin'),
  ('a1000000-0000-0000-0000-000000000001','Kildare'),
  ('a1000000-0000-0000-0000-000000000002','Cork'),
  ('a1000000-0000-0000-0000-000000000002','Kerry'),
  ('a1000000-0000-0000-0000-000000000003','Galway'),
  ('a1000000-0000-0000-0000-000000000003','Mayo'),
  ('a1000000-0000-0000-0000-000000000004','Dublin'),
  ('a1000000-0000-0000-0000-000000000004','Meath'),
  ('a1000000-0000-0000-0000-000000000004','Kildare'),
  ('a1000000-0000-0000-0000-000000000005','Limerick'),
  ('a1000000-0000-0000-0000-000000000005','Ireland-wide'),
  ('a1000000-0000-0000-0000-000000000006','Dublin'),
  ('a1000000-0000-0000-0000-000000000007','Cork'),
  ('a1000000-0000-0000-0000-000000000008','Waterford'),
  ('a1000000-0000-0000-0000-000000000008','Kilkenny'),
  ('a1000000-0000-0000-0000-000000000009','Kilkenny'),
  ('a1000000-0000-0000-0000-000000000010','Sligo'),
  -- Incomplete providers: some have partial areas
  ('a2000000-0000-0000-0000-000000000002','Dublin'),
  ('a2000000-0000-0000-0000-000000000006','Kildare')
  -- ip19 (Fionnuala) intentionally has NO service areas — tests empty state
ON CONFLICT DO NOTHING;


-- ── 8. PROVIDER SUBSCRIPTIONS ────────────────────────────────
INSERT INTO public.provider_subscriptions (provider_id, plan, status, current_period_start, current_period_end)
VALUES
  -- Verified providers
  ('a1000000-0000-0000-0000-000000000001','premium',      'active', now()-interval'20 days', now()+interval'10 days'),
  ('a1000000-0000-0000-0000-000000000002','premium',      'active', now()-interval'15 days', now()+interval'15 days'),
  ('a1000000-0000-0000-0000-000000000003','professional', 'active', now()-interval'10 days', now()+interval'20 days'),
  ('a1000000-0000-0000-0000-000000000004','professional', 'active', now()-interval'5 days',  now()+interval'25 days'),
  ('a1000000-0000-0000-0000-000000000005','professional', 'active', now()-interval'12 days', now()+interval'18 days'),
  ('a1000000-0000-0000-0000-000000000006','basic',        'active', now(),                   now()+interval'30 days'),
  ('a1000000-0000-0000-0000-000000000007','basic',        'active', now(),                   now()+interval'30 days'),
  ('a1000000-0000-0000-0000-000000000008','basic',        'active', now(),                   now()+interval'30 days'),
  ('a1000000-0000-0000-0000-000000000009','basic',        'active', now(),                   now()+interval'30 days'),
  ('a1000000-0000-0000-0000-000000000010','basic',        'active', now(),                   now()+interval'30 days'),
  -- Incomplete provider with cancelled sub
  ('a2000000-0000-0000-0000-000000000002','basic','active', now(), now()+interval'30 days'),
  ('a2000000-0000-0000-0000-000000000003','basic','cancelled', now()-interval'20 days', now()-interval'5 days')
ON CONFLICT (provider_id) DO NOTHING;


-- ── 9. PROVIDER CREDITS ──────────────────────────────────────
INSERT INTO public.provider_credits (provider_id, balance)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 48),  -- premium: 60 granted, 12 spent
  ('a1000000-0000-0000-0000-000000000002', 50),  -- premium: 60 granted, 10 spent
  ('a1000000-0000-0000-0000-000000000003', 18),  -- professional: 25 granted, 7 spent
  ('a1000000-0000-0000-0000-000000000004', 19),  -- professional: 25 granted, 6 spent
  ('a1000000-0000-0000-0000-000000000005', 20),  -- professional: 25 granted, 5 spent
  ('a1000000-0000-0000-0000-000000000006',  2),  -- basic: 5 granted, 3 spent
  ('a1000000-0000-0000-0000-000000000007',  3),  -- basic: 5 granted, 2 spent
  ('a1000000-0000-0000-0000-000000000008',  3),  -- basic: 5 granted, 2 spent
  ('a1000000-0000-0000-0000-000000000009',  5),  -- basic: 5 granted, 0 spent (new)
  ('a1000000-0000-0000-0000-000000000010',  5),  -- basic: 5 granted, 0 spent (new)
  ('a2000000-0000-0000-0000-000000000002',  4),
  ('a2000000-0000-0000-0000-000000000006',  5)
ON CONFLICT (provider_id) DO UPDATE SET balance = EXCLUDED.balance;

INSERT INTO public.credit_transactions (provider_id, amount, reason)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 60, 'monthly_grant'),
  ('a1000000-0000-0000-0000-000000000001', -12, 'quote_submitted'),
  ('a1000000-0000-0000-0000-000000000002', 60, 'monthly_grant'),
  ('a1000000-0000-0000-0000-000000000002', -10, 'quote_submitted'),
  ('a1000000-0000-0000-0000-000000000003', 25, 'monthly_grant'),
  ('a1000000-0000-0000-0000-000000000003', -7, 'quote_submitted'),
  ('a1000000-0000-0000-0000-000000000004', 25, 'monthly_grant'),
  ('a1000000-0000-0000-0000-000000000004', -6, 'quote_submitted'),
  ('a1000000-0000-0000-0000-000000000005', 25, 'monthly_grant'),
  ('a1000000-0000-0000-0000-000000000005', -5, 'quote_submitted'),
  ('a1000000-0000-0000-0000-000000000006', 5, 'monthly_grant'),
  ('a1000000-0000-0000-0000-000000000006', -3, 'quote_submitted'),
  ('a1000000-0000-0000-0000-000000000007', 5, 'monthly_grant'),
  ('a1000000-0000-0000-0000-000000000007', -2, 'quote_submitted'),
  ('a1000000-0000-0000-0000-000000000008', 5, 'monthly_grant'),
  ('a1000000-0000-0000-0000-000000000008', -2, 'quote_submitted');


-- ── 10. JOBS ─────────────────────────────────────────────────

-- ╌╌╌ 10a. COMPLETED JOBS (8) ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
INSERT INTO public.jobs (
  id, customer_id, title, category, description,
  eircode, county, locality, budget_range,
  status, job_mode, task_type,
  requires_verified_id, complete_marked_at, created_at, updated_at
)
VALUES
  -- j_comp_01: Emma hired Aoife for home cleaning
  ('b1000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000001',
   'Deep clean 3-bed house before moving out',
   'Cleaning', 'Full end-of-tenancy deep clean. Kitchen, bathrooms, carpets. 3 bedrooms, 2 bathrooms.',
   'D12P5HX','Dublin','Dublin 12','€100-€200','completed','get_quotes','in_person',
   true, now()-interval'60 days', now()-interval'80 days', now()-interval'60 days'),

  -- j_comp_02: Jack hired Ciarán for plumbing
  ('b1000000-0000-0000-0000-000000000002',
   'a3000000-0000-0000-0000-000000000002',
   'Fix leaking bathroom tap and replace kitchen mixer',
   'Repairs', 'Bathroom hot tap drips constantly. Kitchen mixer needs full replacement. Ground floor flat.',
   'T12HK42','Cork','Cork City','€50-€100','completed','get_quotes','in_person',
   true, now()-interval'55 days', now()-interval'70 days', now()-interval'55 days'),

  -- j_comp_03: Sinéad hired Siobhán for electrical
  ('b1000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000003',
   'Install 4 outdoor security lights',
   'Repairs', 'Need 4 LED security lights installed around the perimeter. External cabling required.',
   'D14FV29','Dublin','Dublin 14','€100-€200','completed','get_quotes','in_person',
   true, now()-interval'50 days', now()-interval'65 days', now()-interval'50 days'),

  -- j_comp_04: Aoife Byrne hired Pádraig for painting
  ('b1000000-0000-0000-0000-000000000004',
   'a3000000-0000-0000-0000-000000000005',
   'Paint 2 bedrooms and hallway',
   'Renovation', 'Full repaint including ceilings. Customer provides paint. 2 coats required. Mid-terrace house.',
   'D18AH26','Dublin','Dublin 18','€200-€500','completed','get_quotes','in_person',
   false, now()-interval'45 days', now()-interval'60 days', now()-interval'45 days'),

  -- j_comp_05: Aoife Byrne hired Niamh for moving
  ('b1000000-0000-0000-0000-000000000005',
   'a3000000-0000-0000-0000-000000000005',
   'House move Dublin 18 to Cork',
   'Moving', '3-bed house full furniture move. Dublin to Cork, approx 260 km. Van + 2 people needed.',
   'D18AH26','Dublin','Dublin 18','€500+','completed','get_quotes','in_person',
   false, now()-interval'90 days', now()-interval'110 days', now()-interval'90 days'),

  -- j_comp_06: Caoimhe hired Seamus for tutoring
  ('b1000000-0000-0000-0000-000000000006',
   'a3000000-0000-0000-0000-000000000007',
   'Junior Cert maths grinds — 6 sessions',
   'Private Lessons', 'My son is struggling with algebra and geometry. Need 6 x 1-hour grinds over 3 weeks. Sligo.',
   'F91PH93','Sligo','Sligo Town','€50-€100','completed','get_quotes','in_person',
   false, now()-interval'30 days', now()-interval'50 days', now()-interval'30 days'),

  -- j_comp_07: Cian hired Diarmuid for tiling
  ('b1000000-0000-0000-0000-000000000007',
   'a3000000-0000-0000-0000-000000000008',
   'Tile new bathroom floor and shower surround',
   'Renovation', '5 m² floor + 8 m² shower walls. 30x60 cm porcelain tiles supplied by customer.',
   'X91WH43','Waterford','Waterford City','€200-€500','completed','get_quotes','in_person',
   false, now()-interval'40 days', now()-interval'55 days', now()-interval'40 days'),

  -- j_comp_08: Tadhg hired Aoife for cleaning
  ('b1000000-0000-0000-0000-000000000008',
   'a3000000-0000-0000-0000-000000000012',
   'Weekly office cleaning — 4-week contract',
   'Cleaning', 'Small office in Cork, 200 m². Monday mornings. Basic cleaning: vacuuming, bins, toilets, kitchen.',
   'T23A8B7','Cork','Cork City','€50-€100','completed','get_quotes','in_person',
   false, now()-interval'20 days', now()-interval'40 days', now()-interval'20 days');


-- ╌╌╌ 10b. OPEN / ACTIVE JOBS (6) ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
INSERT INTO public.jobs (
  id, customer_id, title, category, description,
  eircode, county, locality, budget_range,
  status, job_mode, task_type,
  requires_verified_id, created_at, updated_at
)
VALUES
  -- j_open_01: Conor — open, no quotes yet
  ('b2000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000004',
   'Emergency plumber needed — burst pipe in kitchen',
   'Repairs', 'Pipe burst under kitchen sink. Water flowing. Need someone today if possible. Galway city centre.',
   'H91AY93','Galway','Galway City','€0-€50',
   'open','quick_hire','in_person', true, now()-interval'2 hours', now()-interval'2 hours'),

  -- j_open_02: Conor — open, 2 quotes received (status = quoted)
  ('b2000000-0000-0000-0000-000000000002',
   'a3000000-0000-0000-0000-000000000004',
   'Garden clearance and grass cutting — large back garden',
   'Cleaning', '100 m² overgrown back garden. Need full clearance, weeds, grass cutting, disposal.',
   'H91AY93','Galway','Galway City','€100-€200',
   'quoted','get_quotes','in_person', false, now()-interval'3 days', now()-interval'3 days'),

  -- j_open_03: Emma — open, 1 quote
  ('b2000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000001',
   'Repaint exterior of semi-detached house',
   'Renovation', 'Full exterior repaint. 2 storey semi-d, Dublin 12. Customer provides paint. Weather permitting.',
   'D12P5HX','Dublin','Dublin 12','€200-€500',
   'quoted','get_quotes','in_person', false, now()-interval'5 days', now()-interval'5 days'),

  -- j_open_04: Meadhbh — accepted (quote accepted, awaiting payment/start)
  ('b2000000-0000-0000-0000-000000000004',
   'a3000000-0000-0000-0000-000000000013',
   'Wedding photographer + videographer — June 2026',
   'Events', 'Wedding in Galway, June 14 2026. Need photographer and videographer for full day (10am-11pm).',
   'H14PK23','Galway','Galway City','€500+',
   'accepted','direct_request','in_person', true, now()-interval'10 days', now()-interval'8 days'),

  -- j_open_05: Sinéad — in_progress (timer running)
  ('b2000000-0000-0000-0000-000000000005',
   'a3000000-0000-0000-0000-000000000003',
   'Full rewire — 3 bed house Dublin 14',
   'Repairs', 'Old wiring needs full replacement. Consumer unit upgrade. 3-bed semi-d. Fuse board in utility.',
   'D14FV29','Dublin','Dublin 14','€500+',
   'in_progress','get_quotes','in_person', true, now()-interval'7 days', now()-interval'7 days'),

  -- j_open_06: Darragh — open, no quotes
  ('b2000000-0000-0000-0000-000000000006',
   'a3000000-0000-0000-0000-000000000006',
   'Removal and replacement of old boiler',
   'Repairs', 'Old gas boiler needs full replacement. 4-bed house in Limerick. Gas Safe cert required.',
   'V94K2HT','Limerick','Limerick City','€200-€500',
   'open','get_quotes','in_person', true, now()-interval'1 day', now()-interval'1 day');


-- Update category_id FK for all jobs (backfill from category text)
UPDATE public.jobs j
SET category_id = c.id
FROM public.categories c
WHERE j.category_id IS NULL
  AND lower(c.name) = lower(j.category);


-- ── 11. QUOTES ───────────────────────────────────────────────

-- ╌╌╌ Accepted quotes on completed jobs ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
INSERT INTO public.quotes (
  id, job_id, pro_id, quote_amount_cents, message, availability_slots,
  status, ranking_score, created_at, updated_at
)
VALUES
  ('c1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   15000, 'Happy to do a full end-of-tenancy clean. Available this Saturday from 9am. I bring all equipment and eco products.',
   '["Saturday 9am-1pm","Sunday 10am-2pm"]', 'accepted', 95,
   now()-interval'79 days', now()-interval'79 days'),

  ('c1000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002',
   8000, 'I can fix the bathroom tap and replace the kitchen mixer in one visit. All parts included.',
   '["Monday 2pm-4pm","Tuesday 10am-12pm"]', 'accepted', 92,
   now()-interval'69 days', now()-interval'69 days'),

  ('c1000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003',
   16000, 'I can install all 4 lights in a single day. Fully insured, Safe Pass cert held.',
   '["Wednesday 8am-5pm"]', 'accepted', 88,
   now()-interval'64 days', now()-interval'64 days'),

  ('c1000000-0000-0000-0000-000000000004',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000004',
   38000, 'I can complete 2 bedrooms + hallway in 2 days. Prep, undercoat, 2 finish coats. Fully clean finish.',
   '["Next Monday-Tuesday all day"]', 'accepted', 85,
   now()-interval'59 days', now()-interval'59 days'),

  ('c1000000-0000-0000-0000-000000000005',
   'b1000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000005',
   60000, 'Full house move handled with care. Padded van, 2 crew. Dublin-Cork, depart 7am. All packed and protected.',
   '["Any Saturday"]', 'accepted', 90,
   now()-interval'109 days', now()-interval'109 days'),

  ('c1000000-0000-0000-0000-000000000006',
   'b1000000-0000-0000-0000-000000000006',
   'a1000000-0000-0000-0000-000000000006',
   9000, 'I offer 6 grinds x 1 hr for Junior Cert maths. Algebra + geometry focus. Sligo area.',
   '["Tues & Thurs 5-6pm"]', 'accepted', 78,
   now()-interval'49 days', now()-interval'49 days'),

  ('c1000000-0000-0000-0000-000000000007',
   'b1000000-0000-0000-0000-000000000007',
   'a1000000-0000-0000-0000-000000000008',
   35000, 'Full bathroom tiling, floor + shower walls. Standard adhesive + grout included in price.',
   '["Next week Mon-Wed"]', 'accepted', 82,
   now()-interval'54 days', now()-interval'54 days'),

  ('c1000000-0000-0000-0000-000000000008',
   'b1000000-0000-0000-0000-000000000008',
   'a1000000-0000-0000-0000-000000000001',
   28000, 'Weekly office clean every Monday morning 7-9am. 4-week initial contract. Includes all supplies.',
   '["Every Monday 7-9am"]', 'accepted', 88,
   now()-interval'39 days', now()-interval'39 days');


-- Update accepted_quote_id on completed jobs
UPDATE public.jobs SET accepted_quote_id = 'c1000000-0000-0000-0000-000000000001' WHERE id = 'b1000000-0000-0000-0000-000000000001';
UPDATE public.jobs SET accepted_quote_id = 'c1000000-0000-0000-0000-000000000002' WHERE id = 'b1000000-0000-0000-0000-000000000002';
UPDATE public.jobs SET accepted_quote_id = 'c1000000-0000-0000-0000-000000000003' WHERE id = 'b1000000-0000-0000-0000-000000000003';
UPDATE public.jobs SET accepted_quote_id = 'c1000000-0000-0000-0000-000000000004' WHERE id = 'b1000000-0000-0000-0000-000000000004';
UPDATE public.jobs SET accepted_quote_id = 'c1000000-0000-0000-0000-000000000005' WHERE id = 'b1000000-0000-0000-0000-000000000005';
UPDATE public.jobs SET accepted_quote_id = 'c1000000-0000-0000-0000-000000000006' WHERE id = 'b1000000-0000-0000-0000-000000000006';
UPDATE public.jobs SET accepted_quote_id = 'c1000000-0000-0000-0000-000000000007' WHERE id = 'b1000000-0000-0000-0000-000000000007';
UPDATE public.jobs SET accepted_quote_id = 'c1000000-0000-0000-0000-000000000008' WHERE id = 'b1000000-0000-0000-0000-000000000008';


-- ╌╌╌ Open job quotes (pending) ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
INSERT INTO public.quotes (
  id, job_id, pro_id, quote_amount_cents, message, availability_slots,
  status, ranking_score, created_at, updated_at
)
VALUES
  -- jo_02 has 2 quotes (Aoife + Ciara)
  ('c1000000-0000-0000-0000-000000000009',
   'b2000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000001',
   12000, 'Can clear and cut your garden this weekend. Bring my own tools and take all waste away.',
   '["Saturday 9am"]', 'pending', 80,
   now()-interval'2 days', now()-interval'2 days'),

  ('c1000000-0000-0000-0000-000000000010',
   'b2000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000009',
   14000, 'Happy to do the full clearance and cut. Available next Saturday.',
   '["Next Saturday all day"]', 'pending', 72,
   now()-interval'1 day', now()-interval'1 day'),

  -- jo_03 has 1 quote (Pádraig)
  ('c1000000-0000-0000-0000-000000000011',
   'b2000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000004',
   45000, 'Exterior of 2-storey semi. Weather permitting, 3 day job. Scaffold access included in price.',
   '["Starting next Monday weather permitting"]', 'pending', 85,
   now()-interval'4 days', now()-interval'4 days'),

  -- jo_04 has 1 accepted quote (direct request to Aoife for wedding)
  ('c1000000-0000-0000-0000-000000000012',
   'b2000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000007',
   250000, 'Delighted to help with your June 14 wedding! Full day coverage, edited photos + highlight video delivered in 4 weeks.',
   '["June 14 2026 full day"]', 'accepted', 95,
   now()-interval'9 days', now()-interval'9 days'),

  -- jo_05 has 1 accepted quote (Siobhán on in_progress rewire job)
  ('c1000000-0000-0000-0000-000000000013',
   'b2000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000003',
   120000, 'Full rewire + consumer unit upgrade. 3 days on site. RECI cert provided on completion.',
   '["Starting Monday"]', 'accepted', 90,
   now()-interval'8 days', now()-interval'8 days');

-- Update accepted_quote_id on active jobs
UPDATE public.jobs SET accepted_quote_id = 'c1000000-0000-0000-0000-000000000012' WHERE id = 'b2000000-0000-0000-0000-000000000004';
UPDATE public.jobs SET accepted_quote_id = 'c1000000-0000-0000-0000-000000000013' WHERE id = 'b2000000-0000-0000-0000-000000000005';


-- ── 12. REVIEWS ──────────────────────────────────────────────
-- 8 reviews from customers on completed jobs

INSERT INTO public.reviews (
  id, job_id, customer_id, pro_id,
  rating, quality_rating, communication_rating, punctuality_rating, value_rating,
  comment, provider_response, is_public,
  created_at, updated_at
)
VALUES
  -- Emma → Aoife (cleaning)
  ('d1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   5, 5, 5, 5, 5,
   'Absolutely spotless result. Aoife was on time, thorough, and incredibly professional. The landlord gave us our full deposit back. Could not recommend more highly!',
   'Thank you so much Emma! Really lovely to work with you. Best of luck in the new home!',
   true, now()-interval'59 days', now()-interval'58 days'),

  -- Jack → Ciarán (plumbing)
  ('d1000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000002',
   'a3000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002',
   5, 5, 5, 5, 4,
   'Ciarán sorted both jobs quickly and for the price quoted. No mess left behind. Would definitely use again.',
   'Thanks Jack, glad to help! Let me know if anything else needs attention.',
   true, now()-interval'54 days', now()-interval'54 days'),

  -- Sinéad → Siobhán (electrical)
  ('d1000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003',
   5, 5, 5, 5, 5,
   'Siobhán was excellent — all 4 lights installed in a day, everything working perfectly. Very tidy work.',
   NULL,
   true, now()-interval'49 days', now()-interval'49 days'),

  -- Aoife Byrne → Pádraig (painting)
  ('d1000000-0000-0000-0000-000000000004',
   'b1000000-0000-0000-0000-000000000004',
   'a3000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000004',
   4, 4, 5, 4, 4,
   'Good job overall, rooms look great. Took an extra half day but the finish was clean. Communication was very good throughout.',
   'Thanks Aoife, glad you are happy with the finish! The extra time was to get the ceilings right.',
   true, now()-interval'44 days', now()-interval'44 days'),

  -- Aoife Byrne → Niamh (moving)
  ('d1000000-0000-0000-0000-000000000005',
   'b1000000-0000-0000-0000-000000000005',
   'a3000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000005',
   5, 5, 5, 5, 5,
   'Niamh and her crew were incredible. Every item was wrapped and protected. Nothing damaged. Arrived exactly on time.',
   'Such a pleasure! You had everything so well organised too which made our job easy. Enjoy Cork!',
   true, now()-interval'89 days', now()-interval'89 days'),

  -- Caoimhe → Seamus (tutoring)
  ('d1000000-0000-0000-0000-000000000006',
   'b1000000-0000-0000-0000-000000000006',
   'a3000000-0000-0000-0000-000000000007',
   'a1000000-0000-0000-0000-000000000006',
   4, 5, 4, 5, 4,
   'My son really improved his algebra after the 6 sessions. Seamus was patient and explained things clearly. Junior Cert prep sorted!',
   NULL,
   true, now()-interval'29 days', now()-interval'29 days'),

  -- Cian → Diarmuid (tiling)
  ('d1000000-0000-0000-0000-000000000007',
   'b1000000-0000-0000-0000-000000000007',
   'a3000000-0000-0000-0000-000000000008',
   'a1000000-0000-0000-0000-000000000008',
   4, 4, 4, 5, 4,
   'Bathroom looks fantastic. Diarmuid was punctual and the tiling is precise. Would use again.',
   'Thanks Cian! Enjoy the new bathroom!',
   true, now()-interval'39 days', now()-interval'39 days'),

  -- Tadhg → Aoife (office cleaning)
  ('d1000000-0000-0000-0000-000000000008',
   'b1000000-0000-0000-0000-000000000008',
   'a3000000-0000-0000-0000-000000000012',
   'a1000000-0000-0000-0000-000000000001',
   5, 5, 5, 5, 5,
   'Aoife cleaned our office for 4 weeks and we were delighted every single Monday. Extending the contract without hesitation.',
   'Thank you so much Tadhg! Really enjoying working with your team.',
   true, now()-interval'19 days', now()-interval'19 days');


-- ── 13. TASK ALERTS (for matched lead notifications) ─────────
INSERT INTO public.task_alerts (
  provider_id, keywords, counties, task_types, budget_min, enabled
)
VALUES
  ('a1000000-0000-0000-0000-000000000001',
   ARRAY['cleaning','deep clean','end of tenancy'], ARRAY['Dublin','Kildare'],
   ARRAY['in_person'], 5000, true),

  ('a1000000-0000-0000-0000-000000000002',
   ARRAY['plumbing','burst pipe','leaking','boiler'], ARRAY['Cork','Kerry'],
   ARRAY['in_person'], 3000, true),

  ('a1000000-0000-0000-0000-000000000003',
   ARRAY['electrical','wiring','rewire','security lights'], ARRAY['Galway','Mayo'],
   ARRAY['in_person'], 8000, true),

  ('a1000000-0000-0000-0000-000000000004',
   ARRAY['painting','decorating','exterior'], ARRAY['Dublin','Meath','Kildare'],
   ARRAY['in_person'], 15000, true),

  ('a1000000-0000-0000-0000-000000000005',
   ARRAY['moving','house move','removal'], ARRAY['Ireland-wide'],
   ARRAY['in_person'], 30000, true)
ON CONFLICT (provider_id) DO NOTHING;


-- ── 14. VERIFICATION SUMMARY ─────────────────────────────────
-- Quick verification query — run this after the seed to confirm counts
SELECT
  'VERIFIED PROVIDERS'  AS category, COUNT(*) AS total
FROM public.profiles
WHERE id::text LIKE 'a1000000%' AND is_verified = true
UNION ALL
SELECT 'INCOMPLETE PROVIDERS', COUNT(*) FROM public.profiles WHERE id::text LIKE 'a2000000%'
UNION ALL
SELECT 'CUSTOMERS', COUNT(*) FROM public.profiles WHERE id::text LIKE 'a3000000%'
UNION ALL
SELECT 'COMPLETED JOBS', COUNT(*) FROM public.jobs WHERE id::text LIKE 'b1000000%' AND status = 'completed'
UNION ALL
SELECT 'OPEN/ACTIVE JOBS', COUNT(*) FROM public.jobs WHERE id::text LIKE 'b2000000%'
UNION ALL
SELECT 'TOTAL QUOTES', COUNT(*) FROM public.quotes WHERE id::text LIKE 'c1000000%'
UNION ALL
SELECT 'REVIEWS', COUNT(*) FROM public.reviews WHERE id::text LIKE 'd1000000%'
UNION ALL
SELECT 'PROVIDER SUBSCRIPTIONS', COUNT(*) FROM public.provider_subscriptions ps
  JOIN public.profiles p ON ps.provider_id = p.id WHERE p.id::text LIKE 'a1000000%' OR p.id::text LIKE 'a2000000%';
