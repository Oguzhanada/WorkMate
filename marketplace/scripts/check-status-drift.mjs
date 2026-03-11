#!/usr/bin/env node
/**
 * Status Drift Guardrail
 *
 * Detects mismatches between DB CHECK constraints on status columns
 * and hardcoded status literals in TypeScript route handlers.
 *
 * Currently covers: job_intents.status
 * Add more tables/columns as needed.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const errors = [];

// ── Define known constraint enums (source of truth: migration files) ─────────
const CONSTRAINTS = [
  {
    table: 'job_intents',
    column: 'status',
    migrationFile: 'migrations/013_guest_job_intents.sql',
    // Files that insert/update this table, with table name for context matching
    codeFiles: [
      { path: 'app/api/guest-jobs/route.ts', tableRef: 'job_intents' },
      { path: 'app/api/guest-jobs/claim/route.ts', tableRef: 'job_intents' },
    ],
  },
];

// ── Extract allowed values from CHECK constraint in SQL ──────────────────────
function extractCheckValues(sql, column) {
  const regex = new RegExp(
    `check\\s*\\(\\s*${column}\\s+in\\s*\\(([^)]+)\\)`,
    'i'
  );
  const match = sql.match(regex);
  if (!match) return null;
  return match[1]
    .split(',')
    .map((v) => v.trim().replace(/^'|'$/g, ''))
    .filter(Boolean);
}

/**
 * Extract status literals from .insert() and .update() chains on the given table.
 * Scans for .from('<table>').insert/update blocks and collects status: 'value'.
 */
function extractStatusLiteralsForTable(code, tableName) {
  const literals = new Set();

  // Match .from('tableName').insert({...}) and .from('tableName').update({...})
  // These can span many lines, so we use a regex that captures the object block
  const blockRegex = new RegExp(
    `\\.from\\('${tableName}'\\)\\s*\\.(?:insert|update)\\(([\\s\\S]*?)\\)\\s*\\.`,
    'g'
  );

  let blockMatch;
  while ((blockMatch = blockRegex.exec(code)) !== null) {
    const block = blockMatch[1];
    const statusPattern = /status:\s*(?:[^'"\n]*?\?\s*)?['"]([a-z_]+)['"]/g;
    let m;
    while ((m = statusPattern.exec(block)) !== null) {
      literals.add(m[1]);
    }
    // Also catch ternary: condition ? 'a' : 'b'
    const ternaryPattern = /status:\s*[^,]*?\?\s*['"]([a-z_]+)['"]\s*:\s*['"]([a-z_]+)['"]/g;
    let t;
    while ((t = ternaryPattern.exec(block)) !== null) {
      literals.add(t[1]);
      literals.add(t[2]);
    }
  }

  // Also check equality comparisons on intent.status (for read-side guards)
  const guardRegex = new RegExp(
    `(?:intent|row|record)\\.status\\s*(?:!==|===)\\s*['"]([a-z_]+)['"]`,
    'g'
  );
  let gm;
  while ((gm = guardRegex.exec(code)) !== null) {
    literals.add(gm[1]);
  }

  return [...literals];
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  for (const constraint of CONSTRAINTS) {
    const sqlPath = path.join(ROOT, constraint.migrationFile);
    let sql;
    try {
      sql = await fs.readFile(sqlPath, 'utf8');
    } catch {
      errors.push(`Migration file not found: ${constraint.migrationFile}`);
      continue;
    }

    const allowed = extractCheckValues(sql, constraint.column);
    if (!allowed) {
      errors.push(
        `Could not parse CHECK constraint for ${constraint.table}.${constraint.column} in ${constraint.migrationFile}`
      );
      continue;
    }

    const allowedSet = new Set(allowed);

    for (const codeFile of constraint.codeFiles) {
      const filePath = path.join(ROOT, codeFile.path);
      let code;
      try {
        code = await fs.readFile(filePath, 'utf8');
      } catch {
        errors.push(`Code file not found: ${codeFile.path}`);
        continue;
      }

      const literals = extractStatusLiteralsForTable(code, codeFile.tableRef);
      for (const literal of literals) {
        if (!allowedSet.has(literal)) {
          errors.push(
            `STATUS DRIFT: "${literal}" in ${codeFile.path} is NOT in ${constraint.table}.${constraint.column} CHECK constraint. Allowed: [${allowed.join(', ')}]`
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error('\x1b[31mStatus drift check FAILED:\x1b[0m');
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  console.log('\x1b[32m✓ Status drift check passed — all status literals match DB constraints.\x1b[0m');
}

main().catch((err) => {
  console.error('Status drift check failed unexpectedly:', err);
  process.exit(1);
});
