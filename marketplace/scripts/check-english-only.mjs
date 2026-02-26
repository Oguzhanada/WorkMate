#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['app', 'components', 'lib', 'messages', 'docs', 'scripts'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.css']);
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'supabase/.temp']);
const IGNORE_FILES = new Set(['scripts/check-english-only.mjs']);

const TURKISH_CHAR_REGEX = /[ğĞüÜşŞıİöÖçÇ]/;
const NON_ENGLISH_WORD_REGEX = /\b(hizmet|usta|guven|odeme|ilan|musteri|profili|hakkimizda|yardim|iletisim|kullanim|cerez|cok|tum|adim|teklif|dogrulanmis)\b/i;

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if ([...IGNORE_DIRS].some((item) => relPath === item || relPath.startsWith(`${item}/`))) {
        continue;
      }
      yield* walk(fullPath);
      continue;
    }

    if (EXTENSIONS.has(path.extname(entry.name))) {
      yield fullPath;
    }
  }
}

function formatLine(content, lineNumber) {
  const line = content.split(/\r?\n/)[lineNumber - 1] ?? '';
  return line.length > 180 ? `${line.slice(0, 177)}...` : line;
}

async function main() {
  const violations = [];

  for (const dirName of TARGET_DIRS) {
    const full = path.join(ROOT, dirName);
    try {
      const stat = await fs.stat(full);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    for await (const filePath of walk(full)) {
      const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');
      if (IGNORE_FILES.has(relPath)) {
        continue;
      }
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split(/\r?\n/);

      lines.forEach((line, index) => {
        if (TURKISH_CHAR_REGEX.test(line) || NON_ENGLISH_WORD_REGEX.test(line)) {
          violations.push({
            file: relPath,
            line: index + 1,
            preview: formatLine(content, index + 1)
          });
        }
      });
    }
  }

  if (violations.length > 0) {
    console.error('English-only policy violation detected.');
    console.error('Remove non-English text before commit/build.\n');
    for (const issue of violations.slice(0, 120)) {
      console.error(`- ${issue.file}:${issue.line}`);
      console.error(`  ${issue.preview}`);
    }

    if (violations.length > 120) {
      console.error(`\n...and ${violations.length - 120} more violations.`);
    }

    process.exit(1);
  }

  console.log('English-only check passed.');
}

main().catch((error) => {
  console.error('English-only check failed unexpectedly.');
  console.error(error);
  process.exit(1);
});
