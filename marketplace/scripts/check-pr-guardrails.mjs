#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), '..');
const errors = [];
const warnings = [];

// --- Required files check ---
async function testRequiredFilesAsync(title, paths) {
  for (const rel of paths) {
    const full = path.join(ROOT, rel);
    try {
      await fs.access(full);
    } catch {
      errors.push(`${title} missing required file: ${rel}`);
    }
  }
}

// --- Migration pattern check ---
async function testMigrationPatterns(migrationsPath) {
  let files;
  try {
    const entries = await fs.readdir(migrationsPath, { withFileTypes: true });
    files = entries.filter((e) => e.isFile() && e.name.endsWith('.sql'));
  } catch {
    errors.push(`Migrations path not found: ${migrationsPath}`);
    return;
  }

  for (const file of files) {
    const content = await fs.readFile(path.join(migrationsPath, file.name), 'utf8');

    if (/FOR\s+ALL\s+USING\s*\(\s*true\s*\)/i.test(content)) {
      errors.push(`Migration blocked (${file.name}): FOR ALL USING (true)`);
    }
    if (/ALTER\s+TABLE\s+[^;]+\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(content)) {
      errors.push(`Migration blocked (${file.name}): disables RLS`);
    }
    if (/\bDROP\s+TABLE\b/i.test(content) || /\bTRUNCATE\s+TABLE\b/i.test(content)) {
      warnings.push(`Migration warning (${file.name}): destructive operation detected`);
    }
  }
}

// --- Locale hardcoded patterns check ---
async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      yield* walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      yield full;
    }
  }
}

async function testLocaleHardcodedPatterns() {
  const scanRoots = [
    path.join(ROOT, 'marketplace/components'),
    path.join(ROOT, 'marketplace/app/[locale]'),
  ];

  const routePattern = /["'`]\/(dashboard\/[^"'`]*|profile(?:[/?#][^"'`]*)?)["'`]/;
  const safePatterns = [/withLocalePrefix\(/, /\blocalized\(/, /^\s*import\s/];

  let hitCount = 0;

  for (const root of scanRoots) {
    for await (const filePath of walk(root)) {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split(/\r?\n/);

      for (const line of lines) {
        if (!routePattern.test(line)) continue;
        const isSafe = safePatterns.some((p) => p.test(line));
        if (!isSafe) hitCount++;
      }
    }
  }

  if (hitCount > 0) {
    warnings.push(`Locale route scan found ${hitCount} potential hardcoded links. Review recommended.`);
  }
}

// --- Main ---
async function main() {
  await testRequiredFilesAsync('Admin onboarding QA', [
    'marketplace/app/[locale]/become-provider/page.tsx',
    'marketplace/components/dashboard/AdminApplicationsPanel.tsx',
    'marketplace/components/dashboard/AdminApplicationDetail.tsx',
    'marketplace/app/api/admin/provider-applications/route.ts',
  ]);

  await testRequiredFilesAsync('Payments ops', [
    'marketplace/app/api/connect/create-secure-hold/route.ts',
    'marketplace/app/api/connect/capture-payment/route.ts',
    'marketplace/app/api/webhooks/stripe/route.ts',
    'marketplace/app/api/disputes/route.ts',
  ]);

  await testRequiredFilesAsync('Task alerts', [
    'marketplace/migrations/036_airtasker_feature_layer.sql',
    'marketplace/app/actions/task-alerts.ts',
    'marketplace/supabase/functions/match-task-alerts/index.ts',
  ]);

  await testMigrationPatterns(path.join(ROOT, 'marketplace/migrations'));
  await testLocaleHardcodedPatterns();

  // Status drift guardrail — catches DB constraint / code literal mismatches
  try {
    const { execSync } = await import('node:child_process');
    execSync('node scripts/check-status-drift.mjs', {
      cwd: path.join(ROOT, 'marketplace'),
      stdio: 'pipe',
    });
  } catch (driftErr) {
    const stderr = driftErr.stderr?.toString() || '';
    const driftLines = stderr.split('\n').filter((l) => l.includes('STATUS DRIFT'));
    for (const line of driftLines) {
      errors.push(line.trim().replace(/^\s*✗\s*/, ''));
    }
    if (driftLines.length === 0) {
      errors.push('Status drift check failed (run npm run check:status-drift for details)');
    }
  }

  if (warnings.length > 0) {
    console.warn('\x1b[33mGuardrail warnings:\x1b[0m');
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  if (errors.length > 0) {
    console.error('\x1b[31mGuardrail failures:\x1b[0m');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log('\x1b[32mPR guardrail checks passed.\x1b[0m');
}

main().catch((err) => {
  console.error('PR guardrail check failed unexpectedly:', err);
  process.exit(1);
});
