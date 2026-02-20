import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter((k) => !process.env[k] || !String(process.env[k]).trim());

if (missing.length) {
  console.error('HEALTH_CHECK_FAIL: missing env vars');
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY);

const client = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function ok(label, detail = '') {
  console.log(`OK   ${label}${detail ? `: ${detail}` : ''}`);
}

function fail(label, detail = '') {
  console.error(`FAIL ${label}${detail ? `: ${detail}` : ''}`);
}

let hasFailure = false;

// 1) Auth users reachable
const { data: usersData, error: usersError } = await client.auth.admin.listUsers({ page: 1, perPage: 200 });
if (usersError) {
  hasFailure = true;
  fail('auth.admin.listUsers', usersError.message);
} else {
  ok('auth.admin.listUsers', `count=${usersData.users.length}`);
}

const users = usersData?.users ?? [];
const userIds = users.map((u) => u.id);

// 2) Core tables reachable
const coreTables = ['profiles', 'jobs', 'quotes', 'reviews', 'pro_documents'];
for (const table of coreTables) {
  const { error } = await client.from(table).select('*', { head: true, count: 'exact' }).limit(1);
  if (error) {
    hasFailure = true;
    fail(`table:${table}`, `${error.code ?? ''} ${error.message}`.trim());
  } else {
    ok(`table:${table}`);
  }
}

// 3) users -> profiles consistency
if (userIds.length > 0) {
  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id')
    .in('id', userIds);

  if (profilesError) {
    hasFailure = true;
    fail('profiles consistency', profilesError.message);
  } else {
    const profileSet = new Set((profiles ?? []).map((p) => p.id));
    const missingProfiles = userIds.filter((id) => !profileSet.has(id));
    if (missingProfiles.length) {
      hasFailure = true;
      fail('profiles consistency', `missing_for_users=${missingProfiles.length}`);
    } else {
      ok('profiles consistency', 'all users have profile rows');
    }
  }
} else {
  ok('profiles consistency', 'no users yet');
}

// 4) Storage buckets
const { data: buckets, error: bucketError } = await client.storage.listBuckets();
if (bucketError) {
  hasFailure = true;
  fail('storage.listBuckets', bucketError.message);
} else {
  const names = new Set((buckets ?? []).map((b) => b.name));
  const requiredBuckets = ['job-photos', 'pro-documents'];
  const missingBuckets = requiredBuckets.filter((name) => !names.has(name));
  if (missingBuckets.length) {
    hasFailure = true;
    fail('storage buckets', `missing=${missingBuckets.join(',')}`);
  } else {
    ok('storage buckets', requiredBuckets.join(','));
  }
}

if (hasFailure) {
  console.error('\nHEALTH_CHECK_RESULT: FAIL');
  process.exit(1);
}

console.log('\nHEALTH_CHECK_RESULT: PASS');
