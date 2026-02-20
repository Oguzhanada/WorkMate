import {createClient} from '@supabase/supabase-js';
import nextEnv from '@next/env';

const {loadEnvConfig} = nextEnv;
loadEnvConfig(process.cwd());

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_PLATFORM_BASE_URL'
];

const missing = required.filter((key) => !process.env[key] || !String(process.env[key]).trim());

if (missing.length) {
  console.error('Missing required environment variables:');
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const isPlaceholderUrl = /example\.supabase\.co|your-project/i.test(supabaseUrl);
const isPlaceholderKey = /your_|placeholder|example/i.test(supabaseAnonKey);

if (isPlaceholderUrl || isPlaceholderKey) {
  console.error('Supabase credentials in .env.local are placeholders.');
  console.error('Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY with real project values.');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

try {
  const {error} = await client.from('profiles').select('id').limit(1);

  if (!error) {
    console.log('Preflight OK: Supabase reachable and query executed.');
    process.exit(0);
  }

  const acceptable = ['PGRST116', '42501'];

  if (acceptable.includes(String(error.code))) {
    console.log('Preflight OK: Supabase reachable (RLS/empty-result expected).');
    process.exit(0);
  }

  if (String(error.code) === 'PGRST205') {
    console.error('Supabase reachable, but schema is not initialized yet.');
    console.error('Run migrations SQL first: marketplace/migrations/001_initial_marketplace_schema.sql');
    process.exit(1);
  }

  console.error('Supabase query returned unexpected error:');
  console.error(JSON.stringify(error, null, 2));
  process.exit(1);
} catch (err) {
  console.error('Preflight failed: unable to reach Supabase.');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
