import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(String(supabaseUrl), String(serviceKey), {
  auth: { persistSession: false, autoRefreshToken: false },
});

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function listAllUsers() {
  const all = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const users = data?.users ?? [];
    all.push(...users);
    if (users.length < 200) break;
    page += 1;
  }
  return all;
}

async function listAllObjects(bucket, prefix = '') {
  const out = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`list ${bucket}/${prefix} failed: ${error.message}`);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < limit) break;
    offset += limit;
  }
  return out;
}

async function collectFilePaths(bucket, prefix = '') {
  const rows = await listAllObjects(bucket, prefix);
  const files = [];
  for (const row of rows) {
    if (!row?.name) continue;
    if (row.id) {
      const path = prefix ? `${prefix}/${row.name}` : row.name;
      files.push(path);
      continue;
    }
    const nextPrefix = prefix ? `${prefix}/${row.name}` : row.name;
    const nested = await collectFilePaths(bucket, nextPrefix);
    files.push(...nested);
  }
  return files;
}

async function removeUserFolder(bucket, userId) {
  const prefix = `pro-documents/${userId}`;
  const altPrefix = userId;

  const primaryFiles = await collectFilePaths(bucket, prefix);
  if (primaryFiles.length > 0) {
    for (let i = 0; i < primaryFiles.length; i += 100) {
      const chunk = primaryFiles.slice(i, i + 100);
      const { error } = await supabase.storage.from(bucket).remove(chunk);
      if (error) throw new Error(`remove ${bucket} chunk failed: ${error.message}`);
    }
  }

  const altFiles = await collectFilePaths(bucket, altPrefix);
  if (altFiles.length > 0) {
    for (let i = 0; i < altFiles.length; i += 100) {
      const chunk = altFiles.slice(i, i + 100);
      const { error } = await supabase.storage.from(bucket).remove(chunk);
      if (error) throw new Error(`remove ${bucket} alt chunk failed: ${error.message}`);
    }
  }

  return primaryFiles.length + altFiles.length;
}

async function main() {
  const users = await listAllUsers();

  const { data: adminRoles, error: adminRolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');
  if (adminRolesError) throw new Error(`load admin roles failed: ${adminRolesError.message}`);

  const { data: adminProfiles, error: adminProfilesError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');
  if (adminProfilesError) throw new Error(`load admin profiles failed: ${adminProfilesError.message}`);

  const adminIds = uniq([...(adminRoles ?? []).map((r) => r.user_id), ...(adminProfiles ?? []).map((p) => p.id)]);
  if (adminIds.length === 0) {
    throw new Error('No admin user found. Aborting cleanup.');
  }

  const adminSet = new Set(adminIds);
  const nonAdminUsers = users.filter((u) => !adminSet.has(u.id));
  const nonAdminIds = nonAdminUsers.map((u) => u.id);

  console.log(`Admins kept: ${adminIds.length}`);
  console.log(`Users to delete: ${nonAdminIds.length}`);

  if (nonAdminIds.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  const { data: jobsRows, error: jobsError } = await supabase
    .from('jobs')
    .select('id,customer_id')
    .in('customer_id', nonAdminIds);
  if (jobsError) throw new Error(`load jobs failed: ${jobsError.message}`);
  const nonAdminJobIds = (jobsRows ?? []).map((j) => j.id);
  console.log(`Open/owned jobs to remove via cascade: ${nonAdminJobIds.length}`);

  const { data: adminJobsRows, error: adminJobsError } = await supabase
    .from('jobs')
    .select('id,customer_id')
    .in('customer_id', adminIds);
  if (adminJobsError) throw new Error(`load admin jobs failed: ${adminJobsError.message}`);
  const adminJobIds = (adminJobsRows ?? []).map((j) => j.id);
  console.log(`Admin-owned jobs to remove: ${adminJobIds.length}`);

  const userScopedTables = [
    { table: 'notifications', column: 'user_id' },
    { table: 'user_roles', column: 'user_id' },
    { table: 'pro_lead_actions', column: 'pro_id' },
    { table: 'verification_checks', column: 'profile_id' },
    { table: 'pro_portfolio', column: 'profile_id' },
    { table: 'pro_services', column: 'profile_id' },
    { table: 'pro_service_areas', column: 'profile_id' },
    { table: 'pro_documents', column: 'profile_id' },
    { table: 'addresses', column: 'profile_id' },
    { table: 'quotes', column: 'pro_id' },
    { table: 'jobs', column: 'customer_id' },
  ];

  for (const { table, column } of userScopedTables) {
    const { error } = await supabase.from(table).delete().in(column, nonAdminIds);
    if (error) throw new Error(`delete ${table} failed: ${error.message}`);
  }

  if (nonAdminJobIds.length > 0) {
    const jobScopedTables = [
      { table: 'job_messages', column: 'job_id' },
      { table: 'quotes', column: 'job_id' },
      { table: 'reviews', column: 'job_id' },
      { table: 'payments', column: 'job_id' },
      { table: 'pro_lead_actions', column: 'job_id' },
    ];
    for (const { table, column } of jobScopedTables) {
      const { error } = await supabase.from(table).delete().in(column, nonAdminJobIds);
      if (error && !error.message.includes(`column "${column}"`)) {
        throw new Error(`delete ${table} by job failed: ${error.message}`);
      }
    }
  }

  if (adminJobIds.length > 0) {
    const adminJobScopedTables = [
      { table: 'job_messages', column: 'job_id' },
      { table: 'quotes', column: 'job_id' },
      { table: 'reviews', column: 'job_id' },
      { table: 'payments', column: 'job_id' },
      { table: 'pro_lead_actions', column: 'job_id' },
    ];
    for (const { table, column } of adminJobScopedTables) {
      const { error } = await supabase.from(table).delete().in(column, adminJobIds);
      if (error && !error.message.includes(`column "${column}"`)) {
        throw new Error(`delete ${table} by admin job failed: ${error.message}`);
      }
    }

    const { error: deleteAdminJobsError } = await supabase
      .from('jobs')
      .delete()
      .in('id', adminJobIds);
    if (deleteAdminJobsError) {
      throw new Error(`delete admin jobs failed: ${deleteAdminJobsError.message}`);
    }
  }

  const { error: profileDeleteError } = await supabase.from('profiles').delete().in('id', nonAdminIds);
  if (profileDeleteError) throw new Error(`delete profiles failed: ${profileDeleteError.message}`);

  let removedStorageFiles = 0;
  for (const userId of nonAdminIds) {
    removedStorageFiles += await removeUserFolder('pro-documents', userId);
    removedStorageFiles += await removeUserFolder('job-photos', userId);
  }

  let deletedAuthUsers = 0;
  for (const userId of nonAdminIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw new Error(`delete auth user ${userId} failed: ${error.message}`);
    deletedAuthUsers += 1;
  }

  console.log(`Deleted auth users: ${deletedAuthUsers}`);
  console.log(`Removed storage files: ${removedStorageFiles}`);
  console.log('Cleanup complete.');
}

await main();
