#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const WRITE_KEYWORDS = [
  'insert',
  'update',
  'upsert',
  'delete',
  'create',
  'alter',
  'drop',
  'grant',
  'revoke',
  'truncate'
];

function parseArgs(argv) {
  const out = {
    agent: process.env.MCP_AGENT || 'unknown_agent',
    mcp: process.env.MCP_SERVER || 'unknown_mcp',
    action: process.env.MCP_ACTION || '',
    query: process.env.MCP_QUERY || '',
    payload: process.env.MCP_PAYLOAD || '',
    logPath: process.env.MCP_VIOLATION_LOG || path.join('logs', 'mcp-readonly-violations.log'),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (!val) continue;
    if (key === '--agent') out.agent = val;
    if (key === '--mcp') out.mcp = val;
    if (key === '--action') out.action = val;
    if (key === '--query') out.query = val;
    if (key === '--payload') out.payload = val;
    if (key === '--log') out.logPath = val;
  }

  return out;
}

function includesWriteIntent(value) {
  if (!value) return null;
  const text = String(value).toLowerCase();
  for (const keyword of WRITE_KEYWORDS) {
    if (text.includes(keyword)) return keyword;
  }
  return null;
}

function ensureLogDir(logPath) {
  const dir = path.dirname(logPath);
  fs.mkdirSync(dir, { recursive: true });
}

function appendViolation(logPath, record) {
  ensureLogDir(logPath);
  fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`, 'utf8');
}

const args = parseArgs(process.argv.slice(2));

const fields = [
  ['action', args.action],
  ['query', args.query],
  ['payload', args.payload],
];

let found = null;
let fieldName = '';
for (const [name, val] of fields) {
  const keyword = includesWriteIntent(val);
  if (keyword) {
    found = keyword;
    fieldName = name;
    break;
  }
}

if (found) {
  const blockedReason = `Write intent detected in ${fieldName}: keyword "${found}"`;
  const record = {
    timestamp: new Date().toISOString(),
    agent: args.agent,
    mcp: args.mcp,
    attempted_action: args.action || '(missing)',
    blocked_reason: blockedReason
  };
  appendViolation(args.logPath, record);
  console.error(`[BLOCKED] ${blockedReason}`);
  process.exit(2);
}

console.log('[OK] Read-only enforcement passed');
