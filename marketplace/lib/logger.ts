// ── Structured logger ─────────────────────────────────────────────────────────
// Lightweight structured logging without adding a package dependency.
// Output format is JSON-compatible in production (Vercel log drain / Datadog ready)
// and human-readable in development.
//
// To swap in pino later:
//   npm install pino
//   Replace this file with: import pino from 'pino'; export const logger = pino({...});
//   The API (logger.info / logger.warn / logger.error) stays the same.
//
// Sensitive field redaction:
// The following fields are automatically stripped from log output:
//   password, token, api_key, api_key_hash, authorization, cookie,
//   access_token, refresh_token, stripe_key, supabase_key
// ─────────────────────────────────────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'api_key',
  'api_key_hash',
  'authorization',
  'cookie',
  'access_token',
  'refresh_token',
  'stripe_key',
  'supabase_key',
  'secret',
  'private_key',
]);

function redact(obj: LogContext): LogContext {
  const result: LogContext = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redact(value as LogContext);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function log(level: LogLevel, context: LogContext, message: string, requestId?: string): void {
  if (isTest) return; // Suppress logs during tests

  const safe = redact(context);
  const entry = {
    level,
    service: 'workmate-api',
    msg: message,
    time: new Date().toISOString(),
    ...(requestId !== undefined ? { requestId } : {}),
    ...safe,
  };

  if (isProd) {
    // JSON output — structured log drain compatible
    const fn = level === 'error' ? console.error : console.warn;
    fn(JSON.stringify(entry));
  } else {
    // Human-readable in development
    const prefix = `[${level.toUpperCase()}]${requestId !== undefined ? ` [${requestId}]` : ''}`;
    const contextStr = Object.keys(safe).length ? ` ${JSON.stringify(safe)}` : '';
    const fn = level === 'error' ? console.error : console.warn;
    fn(`${prefix} ${message}${contextStr}`);
  }
}

export const logger = {
  debug: (context: LogContext, message: string, requestId?: string) => log('debug', context, message, requestId),
  info:  (context: LogContext, message: string, requestId?: string) => log('info',  context, message, requestId),
  warn:  (context: LogContext, message: string, requestId?: string) => log('warn',  context, message, requestId),
  error: (context: LogContext, message: string, requestId?: string) => log('error', context, message, requestId),
};

// ── Convenience helpers ───────────────────────────────────────────────────────

/** Log an AI call (model, token count, latency). Wire into AI routes for observability. */
export function logAiCall(opts: {
  model: string;
  endpoint: string;
  userId: string;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
  requestId?: string;
}): void {
  const { requestId, ...rest } = opts;
  if (opts.error) {
    logger.error({ ...rest }, 'AI inference failed', requestId);
  } else {
    logger.info({ ...rest }, 'AI inference completed', requestId);
  }
}

/** Log a webhook delivery attempt */
export function logWebhookDelivery(opts: {
  subscriptionId: string;
  url: string;
  event: string;
  statusCode?: number;
  attempt: number;
  success: boolean;
  durationMs: number;
  requestId?: string;
}): void {
  const { requestId, ...rest } = opts;
  if (opts.success) {
    logger.info({ ...rest }, 'Webhook delivered', requestId);
  } else {
    logger.warn({ ...rest }, 'Webhook delivery failed', requestId);
  }
}
