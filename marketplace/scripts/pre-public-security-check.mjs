import {execSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const REQUIRED_GITIGNORE_RULES = [
  'marketplace/.env.local',
  'marketplace/.env.*',
  '!marketplace/.env.example'
];

const HIGH_RISK_PATTERNS = [
  {name: 'Stripe live secret key', regex: /\bsk_live_[0-9a-zA-Z]{10,}\b/},
  {name: 'Stripe webhook secret', regex: /\bwhsec_[0-9a-zA-Z]{10,}\b/},
  {name: 'Supabase service role key', regex: /\bsb_[a-zA-Z0-9_-]{20,}\b/},
  {name: 'AWS access key', regex: /\bAKIA[0-9A-Z]{16}\b/},
  {name: 'Private key block', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/}
];

const ENV_KEY_PATTERN =
  /^(SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|CRON_SECRET|OPENAI_API_KEY)[ \t]*=[ \t]*(.+)$/gm;

const ALLOWED_VALUE_MARKERS = ['REPLACE_ME', 'YOUR_', '<', 'example', 'changeme'];

const TEXT_FILE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.json',
  '.md',
  '.sql',
  '.css',
  '.yml',
  '.yaml',
  '.env',
  '.example',
  '.txt'
]);

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_FILE_EXTENSIONS.has(ext)) return true;
  if (filePath.endsWith('.env.example')) return true;
  if (filePath.endsWith('.md')) return true;
  if (filePath.includes('migrations/')) return true;
  return false;
}

function getTrackedFiles() {
  const output = execSync('git ls-files', {cwd: path.resolve(projectRoot, '..'), encoding: 'utf8'});
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith('marketplace/'));
}

function checkTrackedEnvFiles(files) {
  return files.filter(
    (file) =>
      path.basename(file).startsWith('.env') &&
      file !== 'marketplace/.env.example'
  );
}

function checkGitignoreRules() {
  const gitignorePath = path.resolve(projectRoot, '..', '.gitignore');
  if (!existsSync(gitignorePath)) {
    return ['Root .gitignore is missing.'];
  }
  const content = readFileSync(gitignorePath, 'utf8');
  const missing = REQUIRED_GITIGNORE_RULES.filter((rule) => !content.includes(rule));
  return missing.map((rule) => `Missing .gitignore rule: ${rule}`);
}

function hasAllowedMarker(value) {
  const normalized = value.trim().toLowerCase();
  return ALLOWED_VALUE_MARKERS.some((marker) => normalized.includes(marker.toLowerCase()));
}

function findPatternMatches(content, regex) {
  const source = regex.source;
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  const globalRegex = new RegExp(source, flags);
  return [...content.matchAll(globalRegex)].map((match) => match[0]);
}

function scanFile(relativePath) {
  const absolutePath = path.resolve(path.resolve(projectRoot, '..'), relativePath);
  const content = readFileSync(absolutePath, 'utf8');
  const findings = [];

  for (const pattern of HIGH_RISK_PATTERNS) {
    const matches = findPatternMatches(content, pattern.regex).filter((value) => !hasAllowedMarker(value));
    if (matches.length > 0) {
      findings.push(`${relativePath}: ${pattern.name}`);
    }
  }

  const envMatches = [...content.matchAll(ENV_KEY_PATTERN)];
  for (const match of envMatches) {
    const [, key, rawValue] = match;
    const value = rawValue.trim();
    if (!value) continue;
    if (hasAllowedMarker(value)) continue;
    findings.push(`${relativePath}: ${key} appears to contain a non-placeholder value.`);
  }

  return findings;
}

function scanFiles(files) {
  const findings = [];
  for (const file of files) {
    if (!isTextFile(file)) continue;
    findings.push(...scanFile(file));
  }
  return findings;
}

function checkSqlForRealSeedData(files) {
  const findings = [];
  const sqlFiles = files.filter((file) => file.endsWith('.sql'));

  for (const file of sqlFiles) {
    const absolutePath = path.resolve(path.resolve(projectRoot, '..'), file);
    const content = readFileSync(absolutePath, 'utf8');
    const hasLikelyRealEmail = /insert\s+into[\s\S]*?values[\s\S]*?@[a-z0-9.-]+\.[a-z]{2,}/i.test(content);
    if (hasLikelyRealEmail) {
      findings.push(`${file}: possible real email data in INSERT values.`);
    }
  }

  return findings;
}

function main() {
  const files = getTrackedFiles();

  const trackedEnvFindings = checkTrackedEnvFiles(files).map(
    (file) => `${file}: tracked .env file detected (only .env.example is allowed).`
  );
  const gitignoreFindings = checkGitignoreRules();
  const secretFindings = scanFiles(files);
  const sqlFindings = checkSqlForRealSeedData(files);

  const allFindings = [...trackedEnvFindings, ...gitignoreFindings, ...secretFindings, ...sqlFindings];

  if (allFindings.length > 0) {
    console.error('Pre-public security check failed:\n');
    for (const finding of allFindings) {
      console.error(`- ${finding}`);
    }
    process.exit(1);
  }

  console.log('Pre-public security check passed.');
  console.log(`Scanned ${files.length} tracked files under marketplace/.`);
}

main();
