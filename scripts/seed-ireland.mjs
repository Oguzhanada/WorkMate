/**
 * WorkMate — Realistic Irish Demo Seed Script
 *
 * Run from repo root:
 *   node scripts/seed-ireland.mjs
 *
 * Creates:
 *  - 8 verified providers (verified_pro role, is_verified=true)
 *  - 5 customers
 *  - addresses for all users
 *  - pro_services + pro_service_areas for each provider
 *  - reviews from customers to providers
 *  - 6 open jobs from customers
 *
 * Uses service role key → bypasses RLS.
 * Auth users are created via admin API so passwords are known for testing.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../marketplace/.env.local');

// Parse .env.local manually (no dotenv dependency)
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const DEMO_PASSWORD = 'WorkMate2026!';

const PROVIDERS = [
  {
    email: 'sean.murphy@example.ie',
    full_name: 'Seán Murphy',
    phone: '+353861234001',
    county: 'Dublin',
    city: 'Clontarf',
    eircode: 'D03 A1B2',
    services: ['electrical-work', 'furniture-assembly'],
    areas: ['Dublin', 'Meath', 'Wicklow'],
    bio: 'RECI registered electrician with 12 years experience across Dublin and the greater Leinster area.',
    rating_seed: [5, 5, 4, 5, 4],
  },
  {
    email: 'aoife.brennan@example.ie',
    full_name: 'Aoife Brennan',
    phone: '+353871234002',
    county: 'Cork',
    city: 'Douglas',
    eircode: 'T12 A2C3',
    services: ['regular-cleaning', 'move-out-cleaning', 'ironing-service'],
    areas: ['Cork', 'Kerry'],
    bio: 'Professional home cleaning specialist serving Cork city and county since 2018.',
    rating_seed: [5, 4, 5, 5],
  },
  {
    email: 'padraig.kelly@example.ie',
    full_name: 'Pádraig Kelly',
    phone: '+353851234003',
    county: 'Galway',
    city: 'Salthill',
    eircode: 'H91 B3D4',
    services: ['plumbing-work', 'furniture-assembly'],
    areas: ['Galway', 'Mayo', 'Roscommon'],
    bio: 'RECI-registered plumber. Emergency callouts available 7 days a week across Connacht.',
    rating_seed: [5, 5, 5, 4, 5, 4],
  },
  {
    email: 'siobhan.oconnor@example.ie',
    full_name: "Siobhán O'Connor",
    phone: '+353891234004',
    county: 'Dublin',
    city: 'Rathmines',
    eircode: 'D06 C4E5',
    services: ['painting-decorating'],
    areas: ['Dublin', 'Kildare'],
    bio: 'Fully insured painter and decorator. Interior and exterior. Free estimates within 24 hours.',
    rating_seed: [4, 5, 4, 4, 5],
  },
  {
    email: 'conor.walsh@example.ie',
    full_name: 'Conor Walsh',
    phone: '+353831234005',
    county: 'Limerick',
    city: 'Dooradoyle',
    eircode: 'V94 D5F6',
    services: ['garden-maintenance', 'lawn-care', 'hedge-trimming'],
    areas: ['Limerick', 'Clare', 'Tipperary'],
    bio: 'Garden design and maintenance. From weekly lawn care to full landscaping projects.',
    rating_seed: [5, 4, 5],
  },
  {
    email: 'niamh.ryan@example.ie',
    full_name: 'Niamh Ryan',
    phone: '+353861234006',
    county: 'Waterford',
    city: 'Tramore',
    eircode: 'X91 E6G7',
    services: ['tutoring-secondary', 'exam-preparation'],
    areas: ['Waterford', 'Wexford', 'Kilkenny'],
    bio: 'Qualified secondary school teacher offering Maths and Science grinds for Junior and Leaving Cert.',
    rating_seed: [5, 5, 5, 5],
  },
  {
    email: 'darragh.fitzpatrick@example.ie',
    full_name: 'Darragh Fitzpatrick',
    phone: '+353871234007',
    county: 'Dublin',
    city: 'Sandyford',
    eircode: 'D18 F7H8',
    services: ['it-support', 'laptop-repair', 'network-setup'],
    areas: ['Dublin', 'Wicklow', 'Kildare'],
    bio: 'CompTIA A+ certified IT technician. Home and small-business support across South Dublin.',
    rating_seed: [4, 5, 4, 5, 5],
  },
  {
    email: 'roisin.mcdonald@example.ie',
    full_name: "Róisín McDonald",
    phone: '+353851234008',
    county: 'Mayo',
    city: 'Castlebar',
    eircode: 'F23 G8I9',
    services: ['pet-sitting', 'dog-walking'],
    areas: ['Mayo', 'Sligo', 'Galway'],
    bio: 'Insured pet sitter and dog walker. Daily updates and GPS tracking included on every walk.',
    rating_seed: [5, 5, 4, 5],
  },
];

const CUSTOMERS = [
  {
    email: 'mary.doyle@example.ie',
    full_name: 'Mary Doyle',
    phone: '+353869990001',
    county: 'Dublin',
    city: 'Drumcondra',
    eircode: 'D09 H1K2',
  },
  {
    email: 'tom.burke@example.ie',
    full_name: 'Tom Burke',
    phone: '+353879990002',
    county: 'Cork',
    city: 'Ballincollig',
    eircode: 'T12 I2L3',
  },
  {
    email: 'grace.o.brien@example.ie',
    full_name: "Grace O'Brien",
    phone: '+353849990003',
    county: 'Galway',
    city: 'Oranmore',
    eircode: 'H91 J3M4',
  },
  {
    email: 'liam.power@example.ie',
    full_name: 'Liam Power',
    phone: '+353869990004',
    county: 'Limerick',
    city: 'Castletroy',
    eircode: 'V94 K4N5',
  },
  {
    email: 'emma.quinn@example.ie',
    full_name: 'Emma Quinn',
    phone: '+353879990005',
    county: 'Waterford',
    city: 'Dungarvan',
    eircode: 'X35 L5P6',
  },
];

const OPEN_JOBS = [
  {
    customerIdx: 0,
    title: 'Full rewire of 3-bed semi-detached house',
    category: 'electrical-work',
    description:
      'Need a full rewire of my 1970s semi-detached in Drumcondra. RECI cert required. Will need access for 3-4 days. Meter board upgrade also needed.',
    eircode: 'D09 H1K2',
    budget_range: '€2,000 – €3,500',
  },
  {
    customerIdx: 1,
    title: 'Move-out clean — 2-bed apartment, Ballincollig',
    category: 'move-out-cleaning',
    description:
      'Vacating a 2-bed apartment end of month. Need a thorough move-out clean including oven, windows, and bathroom limescale removal. Property is unfurnished.',
    eircode: 'T12 I2L3',
    budget_range: '€150 – €250',
  },
  {
    customerIdx: 2,
    title: 'Maths grind — Junior Cert, Oranmore',
    category: 'tutoring-secondary',
    description:
      'My daughter is in 3rd year and struggling with Maths. Looking for weekly 1-hour sessions at home in Oranmore or online. Must have Leaving Cert Maths (H1 ideally).',
    eircode: 'H91 J3M4',
    budget_range: '€30 – €45 per session',
  },
  {
    customerIdx: 3,
    title: 'Lawn maintenance x8 sessions — Castletroy',
    category: 'lawn-care',
    description:
      'Need a reliable gardener for fortnightly lawn mowing from April to July. Front and back garden, approximately 80 sqm total. Grass bags must be removed.',
    eircode: 'V94 K4N5',
    budget_range: '€35 – €55 per visit',
  },
  {
    customerIdx: 4,
    title: 'Dog walker needed — 5 days/week, Dungarvan',
    category: 'dog-walking',
    description:
      'Golden Retriever, 3 years old, neutered, fully vaccinated. Needs 1-hour walk Mon–Fri at 9am. Pickup and drop-off at home. Proof of insurance preferred.',
    eircode: 'X35 L5P6',
    budget_range: '€15 – €20 per walk',
  },
  {
    customerIdx: 0,
    title: 'Leaky bathroom tap + toilet cistern repair',
    category: 'plumbing-work',
    description:
      'Two issues: cold tap in main bathroom dripping slowly, and toilet cistern taking 20+ mins to refill. House is in Drumcondra. Happy to supply parts if given the spec in advance.',
    eircode: 'D09 H1K2',
    budget_range: '€80 – €150',
  },
];

// Category slug → UUID mapping (fetched from DB at runtime)
let categoryMap = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function upsertAuthUser(email, fullName, phone) {
  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = existing?.users?.find((u) => u.email === email);
  if (found) {
    console.log(`  ↳ auth user exists: ${email}`);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });

  if (error) {
    console.error(`  ✗ auth user create failed for ${email}:`, error.message);
    return null;
  }

  console.log(`  ✓ auth user created: ${email} (${data.user.id})`);
  return data.user.id;
}

async function upsertProfile(userId, data) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...data }, { onConflict: 'id' });

  if (error) console.error(`  ✗ profile upsert failed (${userId}):`, error.message);
}

async function upsertUserRole(userId, role) {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });

  if (error) console.error(`  ✗ role upsert failed (${userId}/${role}):`, error.message);
}

async function upsertAddress(profileId, { address_line_1, city, county, eircode }) {
  // Delete existing first to avoid duplicates on re-run
  await supabase.from('addresses').delete().eq('profile_id', profileId);

  const { error } = await supabase.from('addresses').insert({
    profile_id: profileId,
    address_line_1,
    locality: city,
    county,
    eircode,
  });

  if (error) console.error(`  ✗ address insert failed (${profileId}):`, error.message);
}

async function loadCategoryMap() {
  const { data, error } = await supabase
    .from('service_categories')
    .select('id,slug')
    .limit(500);

  if (error) {
    console.error('  ✗ could not load service_categories:', error.message);
    return;
  }

  for (const row of data ?? []) {
    categoryMap[row.slug] = row.id;
  }

  console.log(`  ✓ loaded ${Object.keys(categoryMap).length} service categories`);
}

async function upsertProServices(profileId, slugs) {
  await supabase.from('pro_services').delete().eq('profile_id', profileId);

  const rows = slugs
    .map((slug) => {
      const id = categoryMap[slug];
      if (!id) {
        console.warn(`  ⚠ unknown category slug: ${slug} — skipping`);
        return null;
      }
      return { profile_id: profileId, category_id: id };
    })
    .filter(Boolean);

  if (!rows.length) return;

  const { error } = await supabase.from('pro_services').insert(rows);
  if (error) console.error(`  ✗ pro_services insert failed (${profileId}):`, error.message);
}

async function upsertProAreas(profileId, counties) {
  await supabase.from('pro_service_areas').delete().eq('profile_id', profileId);

  const rows = counties.map((county) => ({ profile_id: profileId, county }));
  const { error } = await supabase.from('pro_service_areas').insert(rows);
  if (error) console.error(`  ✗ pro_service_areas insert failed (${profileId}):`, error.message);
}

async function seedReviews(proId, customerId, ratings) {
  // Only insert if no reviews exist for this pro
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('pro_id', proId)
    .limit(1);

  if (existing?.length > 0) {
    console.log(`  ↳ reviews already exist for pro ${proId}`);
    return;
  }

  // Create a synthetic completed job for each review (required FK)
  for (const rating of ratings) {
    // Insert a completed job
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        customer_id: customerId,
        title: 'Completed service (seed)',
        category: 'general',
        description: 'Seeded job for review purposes.',
        eircode: 'D01 A1B2',
        budget_range: '€100 – €200',
        status: 'completed',
      })
      .select('id')
      .single();

    if (jobErr || !job) {
      console.error(`  ✗ seed job insert failed:`, jobErr?.message);
      continue;
    }

    const { error: reviewErr } = await supabase.from('reviews').insert({
      job_id: job.id,
      pro_id: proId,
      customer_id: customerId,
      rating,
      comment: pickReviewComment(rating),
    });

    if (reviewErr) console.error(`  ✗ review insert failed:`, reviewErr.message);
  }
}

const POSITIVE_COMMENTS = [
  'Excellent work, very professional and tidy. Would definitely hire again.',
  'Arrived on time, finished the job to a very high standard. Very happy.',
  'Great communication throughout. Fair price, no hidden charges.',
  'Highly recommended. Very knowledgeable and did a brilliant job.',
  'Fantastic service. Really went the extra mile. Delighted with the result.',
  'Couldn't ask for better. Polite, efficient and left the place spotless.',
];

const AVERAGE_COMMENTS = [
  'Good work overall, took slightly longer than expected but result was fine.',
  'Decent job, a bit pricey but quality was solid.',
  'Happy with the outcome. Communication could have been a bit better.',
];

function pickReviewComment(rating) {
  const pool = rating >= 4 ? POSITIVE_COMMENTS : AVERAGE_COMMENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌱  WorkMate — Irish Demo Seed\n');

  await loadCategoryMap();

  // ---- Customers ----
  const customerIds = [];
  console.log('\n── Customers ──────────────────────────────────────');

  for (const customer of CUSTOMERS) {
    const userId = await upsertAuthUser(customer.email, customer.full_name, customer.phone);
    if (!userId) continue;

    await upsertProfile(userId, {
      full_name: customer.full_name,
      phone: customer.phone,
      role: 'customer',
    });
    await upsertUserRole(userId, 'customer');
    await upsertAddress(userId, {
      address_line_1: `1 ${customer.city} Road`,
      city: customer.city,
      county: customer.county,
      eircode: customer.eircode,
    });

    customerIds.push(userId);
    console.log(`  ✓ customer ready: ${customer.full_name} (${customer.county})`);
  }

  // ---- Providers ----
  const providerIds = [];
  console.log('\n── Providers ──────────────────────────────────────');

  for (const provider of PROVIDERS) {
    const userId = await upsertAuthUser(provider.email, provider.full_name, provider.phone);
    if (!userId) continue;

    await upsertProfile(userId, {
      full_name: provider.full_name,
      phone: provider.phone,
      role: 'verified_pro',
      is_verified: true,
      verification_status: 'verified',
      id_verification_status: 'approved',
    });

    await upsertUserRole(userId, 'customer');   // providers are also customers
    await upsertUserRole(userId, 'verified_pro');

    await upsertAddress(userId, {
      address_line_1: `${provider.city} Business Centre`,
      city: provider.city,
      county: provider.county,
      eircode: provider.eircode,
    });

    await upsertProServices(userId, provider.services);
    await upsertProAreas(userId, provider.areas);

    providerIds.push(userId);
    console.log(`  ✓ provider ready: ${provider.full_name} (${provider.county})`);
  }

  // ---- Reviews ----
  console.log('\n── Reviews ─────────────────────────────────────────');

  // Only seed reviews if we have both customers and providers
  if (customerIds.length > 0 && providerIds.length > 0) {
    for (let i = 0; i < providerIds.length; i++) {
      const proId = providerIds[i];
      const customerId = customerIds[i % customerIds.length];
      const ratings = PROVIDERS[i].rating_seed;
      await seedReviews(proId, customerId, ratings);
      console.log(`  ✓ reviews seeded for ${PROVIDERS[i].full_name} (${ratings.length} reviews)`);
    }
  } else {
    console.log('  ⚠ skipping reviews — no providers or customers created');
  }

  // ---- Open Jobs ----
  console.log('\n── Open Jobs ───────────────────────────────────────');

  for (const job of OPEN_JOBS) {
    const customerId = customerIds[job.customerIdx];
    if (!customerId) continue;

    // Avoid duplicate jobs (check by title + customer)
    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('customer_id', customerId)
      .eq('title', job.title)
      .limit(1);

    if (existing?.length > 0) {
      console.log(`  ↳ job already exists: "${job.title}"`);
      continue;
    }

    const { error } = await supabase.from('jobs').insert({
      customer_id: customerId,
      title: job.title,
      category: job.category,
      description: job.description,
      eircode: job.eircode,
      budget_range: job.budget_range,
      status: 'open',
    });

    if (error) {
      console.error(`  ✗ job insert failed "${job.title}":`, error.message);
    } else {
      console.log(`  ✓ job posted: "${job.title}"`);
    }
  }

  console.log('\n✅  Seed complete!\n');
  console.log('Test credentials (all users):');
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log('\nProvider logins:');
  PROVIDERS.forEach((p) => console.log(`  ${p.email} — ${p.full_name} (${p.county})`));
  console.log('\nCustomer logins:');
  CUSTOMERS.forEach((c) => console.log(`  ${c.email} — ${c.full_name} (${c.county})`));
  console.log();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
